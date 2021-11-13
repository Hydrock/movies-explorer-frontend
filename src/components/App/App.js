import React, { useState, useEffect } from "react";
import { Route, Switch, useHistory, useLocation, Redirect } from "react-router-dom";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute";

import Main from "../Main/Main";
import Login from "../Login/Login";
import Register from "../Register/Register";
import Profile from "../Profile/Profile";
import NotFound from "../NotFound/NotFound";
import Movies from "../Movies/Movies";
import SavedMovies from "../SavedMovies/SavedMovies";
import Alert from '../Alert/Alert';

import mainApi from "../../utils/MainApi";
import moviesApi from "../../utils/MoviesApi";

function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("jwt"));
  const [token, setToken] = useState(false);
  const [currentUser, setCurrentUser] = useState({});

  const [isAlertVisible, setAlertVisability] = useState(false);

  function setAlertVisabilityWrapper(boolVal) {
    setAlertVisability(boolVal);

    if (boolVal === true) {
      setTimeout(() => {
        setAlertVisability(false);
      }, 3000);
    }
  }

  /**
   * Все фильмы
   */
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState(JSON.parse(localStorage.getItem('filteredMovies') || '[]'));
  const [filteredShortMovies, setFilteredShortMovies] = useState(JSON.parse(localStorage.getItem('filteredShortMovies') || '[]'));

  /**
  * Чекбокс короткометражки
  */
  const [shortFilmValue, setShortFilmValue] = useState(false);

  const history = useHistory();
  const location = useLocation();
  const [isSuccess, setIsSuccess] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isNotFound, setIsNotFound] = React.useState(false);
  const [errorMessageMovies, setErrorMessageMovies] = React.useState(false);

  /**
   * Все лайкнутые фильмы
   */
  const [savedMovies, setSavedMovies] = useState([]);
  const [savedFilteredMovies, setSavedFilteredMovies] = useState([]);
  const [savedFilteredShortMovies, setSavedFilteredShortMovies] = useState([]);
  const [mappedSavedFilteredMovies, setMappedSavedFilteredMovies] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (token) {
      setToken(token);
      mainApi
        .checkToken(token)
        .then(({ data }) => {
          if (data) {
            setLoggedIn(true);
            setCurrentUser(data);
          }
        })
        .catch((err) => {
          console.log(err);
          history.push("/signin");
        });
    }
  }, []);

  /**
   * Сохранение всех фильмов в стейт из локалстореджа
   */
  useEffect(() => {
    const movies = localStorage.getItem("movies");
    if (movies) {
      const result = JSON.parse(movies);
      setMovies(result);
    }
  }, [loggedIn]);

  useEffect(() => {
    if (loggedIn) {
      const token = localStorage.getItem("jwt");

      mainApi
        .getSavedMovies(token) // мы делаем запрос на сервер , нам приходят наши сохраненные фильмы
        .then(({ data }) => {
          setSavedMovies(data);
          setSavedFilteredMovies(data);
          setSavedFilteredShortMovies(data);
        })
        .catch((err) => {
          console.log(err);
          setAlertVisabilityWrapper(true);
        });
    } else {
      setSavedMovies([]);
      setSavedFilteredMovies([]);
      setSavedFilteredShortMovies([]);
    }
  }, [loggedIn]);

  useEffect(() => {
    const mapped = savedFilteredMovies.map((item) => {
      return {
        country: item.country,
        description: item.description,
        director: item.director,
        duration: item.duration,
        image: {
          url: item.image,
        },
        nameEN: item.nameEN,
        nameRU: item.nameRU,
        trailerLink: item.trailer,
        year: item.year,
        _id: item._id
      }
    })
    setMappedSavedFilteredMovies(mapped);
  }, [savedFilteredMovies, movies]);

  useEffect(() => {
    setSavedFilteredMovies(savedMovies); //тогда мы добавляем их в массив фильтрованных сохраненных фильмов
  }, [savedMovies]);



  /**
   * Регистрация пользователя
   **/

  function register(registerData) {
    mainApi
      .register(registerData)
      .then(({ data: responseData }) => {
        if (responseData) {
          login({
            email: responseData.email,
            password: registerData.password,
          });
        } else {
          Promise.reject(`Ошибка ${responseData.status}`);
        }
      })
      .catch((err) => {
        console.log(err);
        setIsSuccess("Что-то пошло не так. Попробуйте еще раз.");
      });
  }

  /**
   * Авторизация пользователя
   **/

  function login(data) {
    mainApi
      .login(data)
      .then((res) => {
        localStorage.setItem("jwt", res.data.token);
        setToken(res.token);
        setLoggedIn(true);
        history.push("/movies");
      })
      .catch((err) => {
        console.log(err);
        setIsSuccess("Что-то пошло не так. Попробуйте еще раз.");
      });
  }

  function handleUpdateProfile(data) {
    const token = localStorage.getItem("jwt");
    if (token) {
      mainApi
        .updateUserProfile(data, token)
        .then((res) => {
          localStorage.setItem("currentUser", JSON.stringify(res.data));
          setCurrentUser(res.data);
          setIsSuccess("Профиль успешно обновлен.");
        })
        .catch((err) => {
          setIsSuccess("При обновлении профиля произошла ошибка.");
          console.log(err);
        });
    }
  }

  function handleSignOut(evt) {
    evt.preventDefault();
    setLoggedIn(false);
    setCurrentUser({});
    localStorage.removeItem("jwt");
    localStorage.removeItem("movies");

    history.push("/");
    setMovies([]);

    /* * */
    setFilteredMovies([]);
    localStorage.removeItem('filteredMovies');
    /* * */


    /* * */
    setFilteredShortMovies([]);
    localStorage.removeItem('filteredShortMovies');
    /* * */

    setSavedMovies([]);
    setSavedFilteredMovies([]);
    setSavedFilteredShortMovies([]);
  }

  // запрос к серверу для поиска фильмов
  function handleSearchMovies(text) {
    setErrorMessageMovies(false);
    setIsNotFound(false);
    /**
     * Фильтруем фильмы и сохраняем в стейтах
     */
    function filterMovies(data, text = '') {
      const filteredMovies = filterKeyword(data, text);

      if (filteredMovies.length === 0) {
        setIsNotFound(true);
      } else {
        setIsNotFound(false);

      }

      /* * */
      setFilteredMovies(filteredMovies);
      localStorage.setItem('filteredMovies', JSON.stringify(filteredMovies));
      /* * */

      if (shortFilmValue) {
        const filteredMoviesShort = filterShortfilm(filteredMovies);
        console.log('filteredMoviesShort:', filteredMoviesShort);

        if (filteredMoviesShort.length !== 0) {
          localStorage.setItem('filteredShortMovies', JSON.stringify(filteredMoviesShort));
          setIsNotFound(false);
          setFilteredShortMovies(filteredMoviesShort);
        } else {
          localStorage.removeItem('filteredShortMovies');
          setFilteredShortMovies(filteredMoviesShort);
        }
      } else {
        localStorage.removeItem('filteredShortMovies');
        setFilteredShortMovies([]);
      }
    }

    const isMoviesLocalStorageNotExists = !localStorage.getItem("movies");
    const isMoviesNotExistsInMemory = (!movies || movies.length === 0);
    const isNeedFetchMovies = isMoviesLocalStorageNotExists && isMoviesNotExistsInMemory;

    if (isNeedFetchMovies) {
      setIsLoading(true);

      moviesApi
        .getMovies()
        .then(({ data }) => {
          setIsLoading(false);
          setMovies(data);
          localStorage.setItem("movies", JSON.stringify(data));
          filterMovies(data, text);
        })
        .catch((err) => {
          console.log(err);
          setIsLoading(false);
          setErrorMessageMovies(true);
          setIsNotFound(false);
        });
    } else {
      filterMovies(movies, text);
    }
  }


  //счетчик по ключевым словам
  function filterKeyword(films, text = '') {
    let result = [];
    films.forEach((movie) => {
      if (movie.nameRU.toLowerCase().includes(text.toLowerCase())) {
        result.push(movie);
      }
    });
    return result;
  }

  //счетчик фильмов по времени
  function filterShortfilm(films) {
    return films.filter((movie) => {
      return movie.duration <= 40;
    });
  }

  //при нажатии лайка фильм сохраняется на наш бекенд
  function saveMovieAfterLike(movie) {
    setIsLoading(true);
    const token = localStorage.getItem("jwt"); //запросили токен
    if (token) {
      //если токен пришел
      mainApi
        .saveMovie(movie, token) //делаем запрос на сервер
        .then(({ data }) => {
          let moviesArr = [...savedMovies]; //создаем массив , в который добавлем сохраненные фильмы
          moviesArr.push(data); //добавляем фильмы
          setSavedMovies(moviesArr); // массив с фильмами теперь не пустой
          setIsLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setErrorMessageMovies(true);
          setIsNotFound(false);
        });
    }
  }

  //поиск среди сохраненных фильмов
  function handleSearchSavedMovies(text) {
    const filteredMovies = filterKeyword(savedMovies, text);
    if (shortFilmValue) {
      const filteredMoviesShort = filterShortfilm(filteredMovies);
      if (filteredMoviesShort.length === 0) {
        setIsNotFound(true);
        setSavedFilteredMovies(filteredMoviesShort);
      } else {
        setIsNotFound(false);
        setSavedFilteredMovies(filteredMoviesShort);
      }
    } else {
      if (filteredMovies.length === 0) {
        setIsNotFound(true);
      } else {
        setIsNotFound(false);
      }
      setSavedFilteredMovies(filteredMovies);
    }
  }

  function deleteSavedMovies(id) {
    if (token) {
      mainApi
        .deleteSavedMovie(id, token)

        .then((res) => {
          setIsLoading(true);
          const moviesArr = savedMovies.filter((movie) => {
            return movie._id !== id;
          });
          setSavedMovies(moviesArr);
        })
        .catch((err) => {
          setErrorMessageMovies(true);
          setIsNotFound(false);
        });

      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  }
  return (
    <CurrentUserContext.Provider value={currentUser}>
      <div className="app">
        <Alert isVisible={ isAlertVisible } />
        <Switch>
          <Route exact path="/">
            <Main
              loggedIn={loggedIn}
            />
          </Route>
          <ProtectedRoute
            exact
            path="/movies"
            loggedIn={loggedIn}
            movies={
              filteredShortMovies.length ? filteredShortMovies : filteredMovies
            }
            component={Movies}
            errorMessageMovies={errorMessageMovies}
            isLoading={isLoading}
            onSearchMovies={handleSearchMovies}
            isNotFound={isNotFound}
            setIsNotFound={setIsNotFound}
            shortFilmValue={shortFilmValue}
            setShortFilmValue={setShortFilmValue}
            saveMovieAfterLike={saveMovieAfterLike}
            deleteSavedMovies={deleteSavedMovies}
            savedMovies={savedMovies}
          />
          <ProtectedRoute
            exact
            path="/saved-movies"
            loggedIn={loggedIn}
            component={SavedMovies}
            isNotFound={isNotFound}
            setIsNotFound={setIsNotFound}
            shortFilmValue={shortFilmValue}
            setShortFilmValue={setShortFilmValue}
            errorMessageMovies={errorMessageMovies}
            isLoading={isLoading}
            onSavedMoviesSearch={handleSearchSavedMovies}
            movies={mappedSavedFilteredMovies}
            savedMovies={savedMovies}
            saveMovieAfterLike={saveMovieAfterLike}
            deleteSavedMovies={deleteSavedMovies}
            setSavedFilteredMovies={setSavedFilteredMovies}
          />
          <ProtectedRoute
            exact
            path="/profile"
            loggedIn={loggedIn}
            component={Profile}
            onSignOut={handleSignOut}
            onUpdateProfile={handleUpdateProfile}
            isSuccess={isSuccess}
            setIsSuccess={setIsSuccess}
          />
          <Route exact path="/signin">

            {!loggedIn ? (

              <Login
                onLogin={login}
                setIsSuccess={setIsSuccess}
                isSuccess={isSuccess}

              />
            ) : (

              <Redirect to="/movies" />
            )}

          </Route>
          <Route exact path="/signup">
            {!loggedIn ? (
              <Register
                isSuccess={isSuccess}
                setIsSuccess={setIsSuccess}
                onRegister={register}
              />
            ) : (
              <Redirect to="/movies" />
            )}
          </Route>
          <Route path="*">
            <NotFound />
          </Route>
        </Switch>
      </div>
    </CurrentUserContext.Provider>
  );
}

export default App;

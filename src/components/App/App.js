import React from "react";
import { Route, Switch, useHistory,  useLocation  } from "react-router-dom";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute";

import Main from "../Main/Main";
import Login from "../Login/Login";
import Register from "../Register/Register";
import Profile from "../Profile/Profile";
import NotFound from "../NotFound/NotFound";
import Movies from "../Movies/Movies";
import SavedMovies from "../SavedMovies/SavedMovies";

import mainApi from "../../utils/MainApi";
 import moviesApi from "../../utils/MoviesApi";

function App(props) {
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [token, setToken] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState({});
  const [movies, setMovies] = React.useState([]);
  const [savedMovies, setSavedMovies] = React.useState([]);
  const history = useHistory();
  const pathname = useLocation();
  const [isSuccess, setIsSuccess] = React.useState('');

  const [isLoading, setIsLoading] = React.useState(false);
  const [isNotFound, setIsNotFound]=React.useState(false);

  const checkToken = React.useCallback(
    () => {
    const token = localStorage.getItem("jwt");
    const movies = localStorage.getItem('movies')
    if (token) {
      setToken(token);
      if (movies) {
        const result = JSON.parse(movies);
        setMovies(result);
      }
      mainApi.checkToken(token)
      .then((data) => {
        if (data) {
            history.push(pathname.pathname)
            setLoggedIn(true)
        }
      })
      .catch(err => { 
          console.log(err);
          history.push('/signin');
      })
    }
  },[history]
  );

  React.useEffect(() => {
      checkToken();
  }, [checkToken])

  React.useEffect(() => {
    if (loggedIn){
      history.push('./');
    }
  }, [loggedIn, history])

  React.useEffect(() => {
    if (loggedIn){
      const token = localStorage.getItem('jwt')
      Promise.all([mainApi.getUserProfile(token), moviesApi.getMovies()])
  .then(([userData, moviesData]) => {
    setCurrentUser(userData.data);
    setMovies(moviesData.data);
  })
  .catch((e) => console.log(e));
}
}, [loggedIn]);

  function register(data) {
   return mainApi.register(data)
    .then((data) => {
      if (data) {
        login({ email:data.email, password: data.password })
        history.push("/movies");
    } else {
        Promise.reject(`Ошибка ${data.status}`)
    }
  }) 
      .catch((err) => {
        console.log(err);
        setIsSuccess('Что-то пошло не так. Попробуйте еще раз.');
        })  
  }

  function login(data) {

    mainApi.login(data).then(
      (res) => {
        setLoggedIn(true);
        localStorage.setItem("jwt", res.data.token);
        setToken(res.token);
        history.push("/movies");

      })
      .catch((err) => {
        console.log(err);
        setIsSuccess('Что-то пошло не так. Попробуйте еще раз.');
      })  
  }


 function handleUpdateProfile(data) {
 
    const token = localStorage.getItem("jwt")
    if(token) {
      mainApi.updateUserProfile(data,  token)
      .then((res) =>{
    
        localStorage.setItem('currentUser', JSON.stringify(res.data))
        setCurrentUser(res.data)
         history.push(pathname.pathname)   
         setIsSuccess('Профиль успешно обновлен.'); 
      })
      .catch((err) => {
        setIsSuccess('При обновлении профиля произошла ошибка.')
        console.log(err);
       
      }); 
    }
  }

  function handleSignOut(evt) {
    evt.preventDefault()
    setLoggedIn(false);
    setCurrentUser({})
    localStorage.removeItem('jwt')
    localStorage.removeItem('movies')
    history.push("/")
    setMovies([]);
  }
  
const handleSearchMovies = (text = {}) => {
setIsLoading(true)
  if (!movies.length === 0) {
    const filteredMovies = filter(movies, text);
    if (filteredMovies.length === 0) {
      setIsNotFound(true);
    } else {
      setIsNotFound(false);
    }
  } else {
    moviesApi
          .getMovies()
          .then((data) => { 
            setMovies(data)
            localStorage.setItem('movies', JSON.stringify(data));
            const result = filter(data, text)
            if(result.length === 0) {
              setIsNotFound(true)
            } else {
              setIsNotFound(false)
            }
  })
      .catch((err) => {
        console.log(err);
        setIsSuccess(true);
       
      })
    .finally(() => {
      setIsLoading(false);
    })
  }
};

  function filter(film, text) {
    // debugger;
    let result = [];
    film.data.forEach((movie) => {
      if(movie.nameRU.toLowerCase().includes(text.toLowerCase())) {
        result.push(movie)
      }
    })
   // console.log(result)
    return result;
  }
 

  return (
    <CurrentUserContext.Provider value={currentUser}>
      <div className="app">
        <Switch>
          <Route exact path="/">
            <Main />
          </Route>
          <ProtectedRoute
            exact
            path="/movies"
            loggedIn={loggedIn}
            movies={movies}
            component={Movies}
            isLoading={isLoading}
            onSearchMovies={handleSearchMovies}
            isNotFound={isNotFound}
            isSuccess={isSuccess}
          />
          <ProtectedRoute
            exact
            path="/saved-movies"
            loggedIn={loggedIn}
            component={SavedMovies}
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
            <Login 
            onLogin={login}
            setIsSuccess={setIsSuccess}
            isSuccess={isSuccess}
             
            />
          </Route>
          <Route exact path="/signup">
            <Register 
            isSuccess={isSuccess}
            setIsSuccess={setIsSuccess}
            onRegister={register}
    
           
             />
          </Route>
          <Route path="*">
            <NotFound />
          </Route>
        </Switch>
      </div>
    </CurrentUserContext.Provider>
  )
};

export default App;

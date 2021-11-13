class MainApi {
  constructor(options) {
    this._url = options.baseUrl;
    this._headers = options.headers;
  }

  _handleOriginalResponse(res) {
    if (!res.ok) {
      return Promise.reject(res.status);
    }
    return Promise.resolve(res.json()).then((data) => {
      return { data, status: res.status };
    });
  }

  checkToken(token) {
    return fetch(`${this._url}/users/me`, {
      method: "GET",
      headers: {
        ...this.headers,
        Authorization: `Bearer ${token}`,
      },
    }).then(this._handleOriginalResponse);
  }

  register(data) {
    return fetch(`${this._url}/signup`, {
      method: "POST",
      headers: this._headers,
      body: JSON.stringify(data),
    }).then(this._handleOriginalResponse);
  }

  login(data) {
    return fetch(`${this._url}/signin`, {
      method: "POST",
      headers: this._headers,
      body: JSON.stringify(data),
    }).then(this._handleOriginalResponse);
  }

  updateUserProfile(data, token) {
    return fetch(`${this._url}/users/me`, {
      method: "PATCH",
      headers: {
        ...this._headers,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
      }),
    }).then(this._handleOriginalResponse);
  }

  saveMovie(movie, token) {
    console.log(movie);
    console.log(token);
    return fetch(`${this._url}/movies`, {
      method: "POST",
      headers: {
        ...this._headers,
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        country: movie.country || "null",
        director: movie.director || "null",
        duration: movie.duration,
        year: movie.year,
        description: movie.description,
        image: "https://api.nomoreparties.co" + movie.image.url,
        trailer: movie.trailerLink
          ? movie.trailerLink.startsWith("https")
            ? movie.trailerLink
            : "https://www.youtube.com"
          : "https://www.youtube.com",
        nameRU: movie.nameRU,
        nameEN: movie.nameEN || "null",
        thumbnail:
          "https://api.nomoreparties.co" + movie.image.formats.thumbnail.url,
        movieId: movie.id,
      }),
    }).then(this._handleOriginalResponse);
  }

  getSavedMovies(token) {
    return fetch(`${this._url}/movies`, {
      method: "GET",
      headers: {
        ...this._headers,
        Authorization: `Bearer ${token}`,
      },
    }).then(this._handleOriginalResponse);
  }

  deleteSavedMovie(id, token) {
    console.log(id);
    return fetch(`${this._url}/movies/${id}`, {
      method: "DELETE",
      headers: {
        ...this._headers,
        Authorization: `Bearer ${token}`,
      },
    }).then(this._handleOriginalResponse);
  }
}

const OPTIONS = {
  baseUrl:'http://localhost:3000',
 // baseUrl: "https://api.movies.pesnya.nomoredomains.monster",
  headers: {
    "Content-Type": "application/json",
  },
};

const mainApi = new MainApi(OPTIONS);

export default mainApi;

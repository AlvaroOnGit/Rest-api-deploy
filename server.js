// REST = (Representational State Transfer) It's software architecture, not a framework
// Scalability, Portability, Visibility, Reliability, Modifiable, Simplicity

// Fundaments
// Each entity is considered a resource (image, user, a post...) and its identified with a URL
// HTTP Verbs (GET, POST, PUT, DELETE...) define what operations can be made with resources
// Client can decide the representation of resources (JSON, XML, HTML...)
// Client must send all the information necessary to process the request. The backend shouldn't store any information to be able to answer the request -> Stateless
// Concept separation allows client and server to evolve separately
// Uniform interface

const express = require('express');
const app = express();
const crypto = require('node:crypto');
const { validateMovie, validateMoviePartial } = require('./schemas/movies.js');

app.disable('x-powered-by');
app.use(express.json());

const PORT = process.env.PORT ?? 1234;
const movies = require('./movies.json');

const ACCEPTED_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:1234',
    'https://movies.com'
]

app.get('/', (req, res) => {
    res.end('<h1>Main Page</h1>');
})

//All resources that are movies are identified with the url /movies
app.get('/movies', (req, res) => {

    //************************************CORS****************************************
    // CORS = Cross-Origin Resource Sharing
    // a browser security mechanism that controls which origins are allowed to access
    // resources from another server
    // It's a measure that impedes other urls from accessing js unless explicitly allowed
    // By giving access through a header parameter
    // It's NOT a security replacement, many frameworks bypass CORS altogether

    // The browser never sends the origin header when accessing from the same origin
    // http://localhost:1234 -> http://localhost:1234
    // Allows preselected origins to access our backend
    const origin = req.header('origin' || !origin);
    if (ACCEPTED_ORIGINS.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    //************************************CORS****************************************

    const { genre } = req.query;
    if (genre) {
        const filteredMovies = movies.filter(movie =>
            movie.genre.some(g => g.toLowerCase() === g.toLowerCase()));
        return res.json(filteredMovies);
    }
    res.json(movies);
})

//Dynamic segment (path-to-regexp)
app.get('/movies/:id', (req, res) => {
    const { id } = req.params;
    const movie = movies.find(movie => movie.id === id);
    if (movie) {
        return res.json(movie);
    }
    res.status(400).end('<h1>Movie not found</h1>')
})

app.post('/movies', (req, res) => {

    //The data we're getting from the body must be VALIDATED before pushing it
    //MAKE SURE not injections can be made into the codebase

    //validating the body of the request with a zod schema
    const result = validateMovie(req.body);

    if (result.error) {
        res.status(400).json({error: JSON.parse(result.error.message)});
    }

    //create a new movie
    const newMovie = {
        id: crypto.randomUUID(),
        ...result.data
    }

    //NOT REST because we're saving the app state in memory
    movies.push(newMovie);
    res.status(201).json(newMovie); //update client cache

})

app.patch('/movies/:id', (req, res) => {

    //validate de body with zod
    const result = validateMoviePartial(req.body);

    if (!result.success) {
        res.status(400).json({error: JSON.parse(result.error.message)});
    }

    //get the id of the movie
    const { id } = req.params;

    //get the index of the movie on the array by its id
    const movieIndex = movies.findIndex(movie => movie.id === id);

    //if the index doesnt exist exit
    if (movieIndex === -1) {
        return res.status(404).json({message: 'Movie not found'});
    }

    //Declare the updated data for the movie aswell as its index
    const updatedMovie = {
        ...movies[movieIndex],
        ...result.data
    }

    //update the movie by providing its index
    movies[movieIndex] = updatedMovie;

    return res.status(201).json(updatedMovie);
})

app.delete('/movies/:id', (req, res) => {

    //************************************CORS****************************************
    // Normal methods = GET/HEAD/POST
    // Complex methods = PUT/PATCH/DELETE
    // CORS PRE-Flight = when using complex methods, it requires a special petition named OPTIONS
    // SEE app.options

    const origin = req.header('origin' || !origin);
    if (ACCEPTED_ORIGINS.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    //************************************CORS****************************************

    const { id } = req.params;

    const movieIndex = movies.findIndex(movie => movie.id === id);

    if (movieIndex === -1) {
        return res.status(404).json({message: 'Movie not found'});
    }

    movies.splice(movieIndex, 1);

    return res.json({message: 'Movie deleted'});
})

app.options('/movies/:id', (req, res) => {

    //************************************CORS****************************************
    // We have to allow specific methods to be able to use them when calling the backend
    // Also give authorization to allow headers

    const origin = req.header('origin');
    if (ACCEPTED_ORIGINS.includes(origin || !origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    res.send(200);

    //************************************CORS****************************************
})

app.listen(PORT, () => {
    console.log(`server started on port: http://localhost:${PORT}`);
})
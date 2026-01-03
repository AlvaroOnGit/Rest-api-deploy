//Import the zod module for data validation
const z = require('zod');

//Zod schema
const movieSchema = z.object({
    title: z.string(),
    year: z.number().int().min(1900).max(new Date().getFullYear()),
    director: z.string(),
    duration: z.number().int().positive(),
    genre: z.array(
        z.enum(["action", "adventure", "sci-fi", "fantasy", "drama", "crime"])
    ),
    rating: z.number().min(0).max(10).default(5),
});

//With safeParse returns a result object that tells if there's an error or if there's data
function validateMovie(object){
    return movieSchema.safeParse(object);
}

//Partial means that it will validate any of the parameters provided on the request but doesn't need all of them
function validateMoviePartial(object){
    return movieSchema.partial().safeParse(object);
}

//export the function
module.exports = {
    validateMovie,
    validateMoviePartial
}
/**
 * Sample CSV data for testing import functionality
 */

export const goodreadsCSV = `Book Id,Title,Author,My Rating,My Review,Date Read,Publisher,Year Published
123,"The Great Gatsby","F. Scott Fitzgerald",5,"Amazing book",2024/01/15,"Scribner",1925
456,"To Kill a Mockingbird","Harper Lee",4,"",2024/02/20,"J.B. Lippincott & Co.",1960
789,"1984","George Orwell",5,"Dystopian masterpiece",2024/03/10,"Secker & Warburg",1949`;

export const letterboxdWatchedCSV = `Date,Name,Year,Letterboxd URI,Rating
2024-01-15,The Matrix,1999,https://letterboxd.com/film/the-matrix/,5
2024-02-20,Inception,2010,https://letterboxd.com/film/inception/,4.5`;

export const letterboxdRatingsCSV = `Name,Year,Rating
The Matrix,1999,5
Inception,2010,4.5
The Shawshank Redemption,1994,5`;

export const letterboxdReviewsCSV = `Date,Name,Year,Letterboxd URI,Rating,Review
2024-01-15,The Matrix,1999,https://letterboxd.com/film/the-matrix/,5,"Mind-bending classic"
2024-02-20,Inception,2010,https://letterboxd.com/film/inception/,4.5,"Amazing visuals"`;

export const genericCSV = `title,type,author,director,year,rating,status,tags,notes
"The Great Gatsby",book,"F. Scott Fitzgerald",,1925,5,read,"classic;fiction","Great book"
"The Matrix",movie,,"Wachowski Brothers",1999,5,watched,"sci-fi;action","Loved it"`;

export const csvWithSpecialCharacters = `title,type,author,rating
"Book: A Story",book,"Author, Jr.",5
"Movie with ""Quotes""",movie,"Director Name",4`;

export const csvWithMissingRequiredFields = `title,author,rating
"Incomplete Book",,5
,Some Author,4`;

# COS221Assignment5

Steps for setup:
1) Import dump so you have local copy of database
2) copy .env_example to .env and change database username and password to your local version
3) npm install

TODO:
1) Add Pieters' database changes(remove duplicates and genre table not having any shows)
2) Add genres to shows
3) Be able to update show(episodes, seasons) and movie(duration) specific info
4) Add some css, jeez it's looking ugly xD
5) Delete Genre if catalog is deleted simple - contraint addition



Notes:
I changed the shows, movies, actors and user_views tables constraints to CASCADE on DELETE
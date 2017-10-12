# Conway's Game of Life application with AngulerJS and Node.js

![Screenshot](images/demo_1.png)

Project structure
-------------

```
backend_node      - backend code location
frontend          - fronted code location
```

Set up backend
-------------

* Go to 'backend_node' folder
* Run 'npm install'

Set up frontend
-------------

* Go to 'frontend' folder
* Change config info in 'frontend/src/app/app.constants.js'
* Run 'npm install'
* Run 'bower install'
* Run 'gulp build'

Run backend
-------------

```
cd backend_node
npm run serve // starts the express rest api on http://localhost:3000/
```

Run frontend
-------------

```
cd frontend
npm run serve // starts the angular app on http://localhost:4321/
```


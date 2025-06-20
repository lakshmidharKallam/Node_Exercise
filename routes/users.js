const express = require('express');
const router = express.Router();
const db = require('../db');
const { getUsers, createUser, getSingleUser, addExercise, getUserExerciseLogs } =require("../controllers/userController")



//Get all users
router.get('/api/users', getUsers);

// create new user 
router.post('/api/users', createUser);



//personally i am adding optional id param to check specific user not part of instructions

router.get('/api/users/:id', getSingleUser);


//  Add exercise
router.post('/api/users/:_id/exercises', addExercise);

//get all logs of a user 
router.get('/api/users/:_id/logs', getUserExerciseLogs);



module.exports = router;

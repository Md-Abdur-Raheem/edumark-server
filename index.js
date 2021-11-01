const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

//middle wear
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aimii.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db("Edumark");
        const courseCollection = database.collection("courses");
        const addedCourseCollection = database.collection("addedCourses")

        //get api to read all courses
        app.get('/all-courses', async (req, res) => {
            const cursor = courseCollection.find({})
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/courses', async (req, res) => {
            const cursor = courseCollection.find({}).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })

        //post api to add new courses
        app.post('/add-new-course', async (req, res) => {
            const newUser = req.body;
            const result = await courseCollection.insertOne(newUser);
            res.json(result);
        })

          //use post to get data by keys
          app.post('/all-courses/byCourseId', async (req, res) => {
            const id = req.body;
            const query = { courseId: { $in: id } }
            const courses = await courseCollection.find(query).toArray();
            res.json(courses);
          })
        
        //delete a course
        app.delete('/all-courses/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await courseCollection.deleteOne(query);
            res.json(result);
        })

        //post api to add users added course in addedCourseCollection
        app.post('/addedCourse', async (req, res) => {
            const newAddedCourse = req.body;
            const result = await addedCourseCollection.insertOne(newAddedCourse);
            res.json(result);
        })

        //get api to get specific users added course
        app.get('/addedCourse', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await addedCourseCollection.find(query).toArray();
            res.send(result);
        })


    }
    finally {
        //await client.close()
    }
}
run().catch(console.dir);

app.get('/', (req, res) => res.send('Hello world'));
app.listen(port, () => console.log("Running server on port", port))

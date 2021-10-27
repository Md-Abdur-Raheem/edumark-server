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

        //get api to read all courses
        app.get('/all-courses', async (req, res) => {
            const cursor = courseCollection.find({})
            const result = await cursor.toArray();
            console.log(result)
            res.send(result);
        })

        app.get('/courses', async (req, res) => {
            const cursor = courseCollection.find({}).limit(6);
            const result = await cursor.toArray();
            console.log(result)
            res.send(result);
        })

        //post api to add new courses
        app.post('/add-new-course', async (req, res) => {
            console.log('req hitted');
            const newUser = req.body;
            const result = await courseCollection.insertOne(newUser);
            res.json(result);
        })


    }
    finally {
        //await client.close()
    }
}
run().catch(console.dir);

app.get('/', (req, res) => res.send('Hello world'));
app.listen(port, () => console.log("Running server on port", port))

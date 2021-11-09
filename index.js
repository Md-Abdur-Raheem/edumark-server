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

const admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aimii.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken(req, res, next) {
    if (req.headers.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
            
        }
        catch(error) {
            console.dir(error);
        }
    }
    next();
}

async function run() {
    try {
        await client.connect();
        const database = client.db("Edumark");
        const courseCollection = database.collection("courses");
        const addedCourseCollection = database.collection("addedCourses");
        const usersCollection = database.collection("users");



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
            const newCourse = req.body;
            const result = await courseCollection.insertOne(newCourse);
            res.json(result);
        })

        //get api to show course details by _id
        app.get('/all-course/:id', async (req, res) => {
            const id = req.params.id;
            const result = await courseCollection.findOne({ _id: ObjectId(id) });
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

        //delete api to delete users added course
        app.delete('/addedCourse/:id', async (req, res) => {
            const id = req.params.id;
            const result = await addedCourseCollection.deleteOne({ _id: ObjectId(id) })
            res.json(result);
        })

        //get api to get all users added course
        app.get('/allAddedCourse', async (req, res) => {
            const result = await addedCourseCollection.find({}).toArray();
            res.json(result);
        })

        //add new registered user in users collection
        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const result = await usersCollection.insertOne(newUser);
            res.json(result);
        })

        // add new registered user from google
        app.put('/users', async (req, res) => {
            const newUser = req.body;
            const email = req.body.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = { $set: newUser };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })

        //api to make admin
        app.put('/users/admin', verifyToken, async (req, res) => {
            const email = req.body.email;
            const requester = req.decodedEmail;

            // console.log(requester);
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester })
                if (requesterAccount.role === 'Admin') {
                    const user = { email: email };
                    const updateDoc = { $set: { role : "Admin"} };
                    const result = await usersCollection.updateOne(user, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'You do not have permission to make admin' });
            }
           
        })

        // api to get all admins
        app.get('/users/admin', async (req, res) => {
            const query = req.query.query;
            const filter = { role: query };
            const result = await usersCollection.find(filter).toArray();
            res.json(result);
        })

        //api to remove admin
        app.put('/users/admin/:email', async(req,res)=> {
            const email = req.params.email;
            const admin = { email: email };
            const updataDoc = { $unset: { role: 'Admin' } };
            const result = await usersCollection.updateOne(admin, updataDoc);
            res.json(result);
        })

        //api to check an admin
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email: email }) ;
            let isAdmin = false;
            if (user?.role === 'Admin') {
                isAdmin = true;
            }
            res.json({ isAdmin });
        })


    }
    finally {
        //await client.close()
    }
}

run().catch(console.dir);

app.get('/', (req, res) => res.send('Edumark speaking: Hello world'));
app.listen(port, () => console.log("Running server on port", port))

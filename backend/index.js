import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.listen(5000, () => {
    console.log('Server is running on port 5000');
})

app.use('/', (req, res) => {
    res.send('Hello World');
});
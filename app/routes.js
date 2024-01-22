const express = require("express");
const multer = require("multer");
const { saveToS3 } = require("./awsS3")

const initialize = () => {
    const storage = multer.memoryStorage();
    return multer({
        storage,
    })
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
    console.log("API is Ok");
    res.send({
        status: "API is up and running"
    })
});

app.post("/health", (req, res) => {
    console.log("API is Ok");
    console.log("Paylaod received: ", req.body);
    res.send({
        status: "API is up and running",
        body: req.body
    })
});

app.put("/file/upload", initialize().single("file"), async (req, res) => {
    console.log("Received a file: " + req.file.originalname);
    const response = await saveToS3(process.env.BUCKET_NAME, req.file)
    res.status(response.status).send(response);
});

app.put("/files/upload", initialize().array("files", 25), async (req, res) => {
    console.log("Received files: " + req.files.reduce((prev, next) => `${prev.originalname} , ${next.originalname}`))
    let respArr = [];
    for (let file of req.files) {
        let resp = await saveToS3(process.env.BUCKET_NAME, file);
        respArr.push(resp);
    }
    let status = respArr.every((ell) => ell.status === 200) ? 200 : 500;
    let message = status === 200 ? "all files uploaded successfully" : "Oops some error occured while uploading some files";

    res.status(status).send({
        status: status,
        message: message
    })
});

module.exports = app;
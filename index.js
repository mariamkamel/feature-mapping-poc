const express = require("express");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const bodyParser = require("body-parser");
const features = require("./features");
const app = express();
app.use(bodyParser.json());

app.post("/list-features", async (req, res) => {
    console.log(
        req.body.questionnaire.map((item) => {
            return { Q: item.Q, A: item.A };
        })
    );
    const prompt = `given  the following array of features  delimited by <txt></txt> , and the following questionnaire in the following format [{"Q": "question", "A", "user's answer}], return a list of features names from our the list provided only based on the answers provided\n
        <txt>${features}</txt>\n
        [
        ${req.body.questionnaire.map((item) => {
            return `{Q: ${item.Q}, A: ${item.A}}`;
        })}
        ] \n
        if there is any unrelated answer skip it and if feature needed is not included in the provided features list ignore it and if there is no features mapped at all return "THERE IS NO FEATURES FOUND"
      `;
    console.log("prompt", prompt);

    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        temperature: 0,
    });
    console.log(completion.data.choices[0].text);
    console.log(completion.data);
    res.send("Successful response." + completion.data.choices[0].text);
});

app.listen(3000, () => console.log("Example app is listening on port 3000."));

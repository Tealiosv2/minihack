const http = require("http");
const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");
const axios = require('axios');

const endpoint = "https://minihackathon.cognitiveservices.azure.com/";
const key = "46d79c54c94b4979b30ac58d8b6fdeca";
const textAnalyticsClient = new TextAnalyticsClient(endpoint, new AzureKeyCredential(key));

const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type"
        });
        res.end();
    } else if (req.method === "POST" && req.url === "/api/analyze") {
        res.writeHead(200, { "Content-Type": "application/json" });

        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", async () => {
            const payload = JSON.parse(body);
            const sentence = payload.sentence;
            const result = await analyzeText([sentence]);
            res.end(JSON.stringify(result));
        });
    } else {
        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Method not allowed!");
    }
});

async function run(text) {
    try {
        const response = await axios.post(
            'https://api.sapling.ai/api/v1/paraphrase',
            {
                key: 'J6EBY1K5S1V77BDTU5L50DKUT29AN48L',
                text,
            },
        );
        const {status, data} = response;
        return data.results[0].replacement;
    } catch (err) {
        const { msg } = err.response.data;
        console.log({err: msg});
    }
}

async function analyzeText(input) {
    const result = await textAnalyticsClient.analyzeSentiment(input);
    const sentiment = result[0].sentiment;
    const scores = result[0].confidenceScores;
    const score = Math.max(...Object.values(scores));
    const paraphrase = await run(input[0]);

    return { sentiment, score, paraphrase };
}

const port = process.env.PORT || 5500;
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/`);
});
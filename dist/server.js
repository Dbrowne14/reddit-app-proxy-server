import express from "express";
import cors from "cors";
import { findMedia, findImg } from "./serverFns.js";
const app = express();
app.use(cors());
const PORT = Number(process.env.PORT) || 5000;
// decide on the subreddits others to consider are perfectloops and cinemagraphs
const preLoadedSubReddits = [
    "pixelart",
    "imaginarylandscapes",
    "imaginaryarchitecture",
    "earthporn",
    "cityporn",
];
const subCheck = (req, res, next) => {
    const subreddit = req.params.subreddit.toLowerCase();
    if (!preLoadedSubReddits.includes(subreddit)) {
        return res.status(404).send(`Subreddit ${req.params.subreddit} does not exist`);
    }
    req.params.subreddit = subreddit; // optional but keeps things consistent
    next();
};
app.get("/", (req, res) => res.send("RedGallery API is running!"));
//get the whole subreddit data file
app.get("/r/:subreddit", subCheck, async (req, res) => {
    const { subreddit } = req.params;
    try {
        const subRes = await fetch(`https://www.reddit.com/r/${subreddit}/.json?limit=30`);
        const subJson = await subRes.json();
        const posts = subJson.data.children.map((post) => ({
            title: post.data.title,
            media: findMedia(post),
            upvote_ratio: post.data.upvote_ratio,
        }));
        res.json({
            subreddit,
            posts,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        }
        else {
            res.status(500).send(String(error));
        }
    }
});
app.get("/r/:subreddit/about", subCheck, async (req, res) => {
    const { subreddit } = req.params;
    try {
        const subRes = await fetch(`https://www.reddit.com/r/${subreddit}/about/.json`);
        const subAboutJson = await subRes.json();
        res.json({
            subreddit,
            subCount: subAboutJson.data.subscribers,
            image: findImg(subAboutJson),
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        }
        else {
            res.status(500).send(String(error));
        }
    }
});
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));

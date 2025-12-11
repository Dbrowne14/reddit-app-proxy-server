import express from "express";
import cors from "cors";
import { findMedia, findImg } from "./serverFns.js";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 4000;

// decide on the subreddits
const preLoadedSubReddits = [
  "educationalgifs",
  "perfectloops",
  "Cinemagraphs",
  "mechanical_gifs",
  //"gifsthatkeepongiving"
];


const subCheck = (req, res, next) => {
  const { subreddit } = req.params;
  if (!preLoadedSubReddits.includes(subreddit)) {
    return res.status(404).send(`Subreddit ${subreddit} does not exist`);
  }
  next();
};

//get the whole subreddit data file
app.get("/r/:subreddit", subCheck, async (req, res) => {
  const { subreddit } = req.params;
  try {
    const subRes = await fetch(
      `https://www.reddit.com/r/${subreddit}/.json?limit=20`
    );
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
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("r/:subreddit/about", subCheck, async (req, res) => {
    const {subreddit} = req.params;
    try {
        const subRes = await fetch(`https://www.reddit.com/r/${subreddit}/about/.json`
        );
        const subAboutJson = await subRes.json();

        res.json({
            subCount: subAboutJson.data.subscribers,
            image: findImg(subAboutJson)
        })

    } catch (error) {
        res.status(500).send(error.message);
    }
})

app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));

import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import { findMedia, findImg } from "./serverFns.js";
import type { SubRedditParams, RedditChild } from "./types.js";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = express();
app.use(cors());
const PORT = Number(process.env.PORT) || 3000;

// decide on the subreddits others to consider are perfectloops and cinemagraphs
const preLoadedSubReddits = [
  "pixelart",
  "imaginarylandscapes",
  "imaginaryarchitecture",
  "earthporn",
  "cityporn",
];

const subCheck = (
  req: Request<SubRedditParams>,
  res: Response,
  next: NextFunction,
) => {
  const subreddit = req.params.subreddit.toLowerCase();

  if (!preLoadedSubReddits.includes(subreddit)) {
    return res
      .status(404)
      .send(`Subreddit ${req.params.subreddit} does not exist`);
  }

  req.params.subreddit = subreddit; // optional but keeps things consistent
  next();
};

//get the whole subreddit data file
app.get(
  "/r/:subreddit",
  subCheck,
  async (req: Request<SubRedditParams>, res: Response) => {
    const { subreddit } = req.params;
    try {
      const subRes = await fetch(
        `https://www.reddit.com/r/${subreddit}/.json?limit=30`,
      );
      const subJson = await subRes.json();

      const posts = subJson.data.children.map((post: RedditChild) => ({
        title: post.data.title,
        media: findMedia(post),
        upvote_ratio: post.data.upvote_ratio,
      }));

      res.json({
        subreddit,
        posts,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).send(error.message);
      } else {
        res.status(500).send(String(error));
      }
    }
  },
);

app.get(
  "/r/:subreddit/about",
  subCheck,
  async (req: Request<SubRedditParams>, res: Response) => {
    const { subreddit } = req.params;
    try {
      const subRes = await fetch(
        `https://www.reddit.com/r/${subreddit}/about/.json`,
      );
      const subAboutJson = await subRes.json();

      res.json({
        subreddit,
        subCount: subAboutJson.data.subscribers,
        image: findImg(subAboutJson),
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).send(error.message);
      } else {
        res.status(500).send(String(error));
      }
    }
  },
);

// maunal update of database posts
app.post("/subreddit", async (_, res) => {
  try {
    const results = [];
    for (const sub of preLoadedSubReddits) {
      const subRes = await fetch(`https://www.reddit.com/r/${sub}/about/.json`);
      const subAboutJson = await subRes.json();
      const { name, display_name_prefixed, subscribers } = subAboutJson.data;
      const img = findImg(subAboutJson);

      const dbres = await pool.query(
        `
        INSERT INTO subreddit (id, subname, subcount, image)
        VALUES($1, $2, $3, $4)
        ON CONFLICT(id) DO UPDATE SET
        subname = EXCLUDED.subname,
        subcount = EXCLUDED.subcount,
        image = EXCLUDED.image
        RETURNING *;
        `,
        [name, display_name_prefixed, subscribers, img],
      );
      results.push(dbres.rows[0]);
    }
    res.status(200).json({ message: "complete", data: results });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

app.post("/posts", async (_, res) => {
  try {
    const results = [];
    for (const sub of preLoadedSubReddits) {
      const subRes = await fetch(
        `https://www.reddit.com/r/${sub}/.json?limit=30`,
      );
      const subJson = await subRes.json();

      for (const post of subJson.data.children) {
        const { name, title, upvote_ratio, subreddit_name_prefixed } =
          post.data;
        const media = findMedia(post);
        if (media) {
          const dbres = await pool.query(
            `INSERT INTO posts (id, subreddit_name, post_title, upvote_ratio, media_type, media_url, media_width, media_height)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
            media_url = EXCLUDED.media_url,
            media_type = EXCLUDED.media_type,         
            upvote_ratio = EXCLUDED.upvote_ratio
            RETURNING *;`,
            [
              name,
              subreddit_name_prefixed,
              title,
              upvote_ratio,
              media.type,
              media.url,
              media.width,
              media.height,
            ],
          );
          results.push(dbres.rows[0]);
        }
      }
    }
    res.status(200).json({ message: "complete", data: results });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

app.get("/", (req, res) => {
  res.json({ hello: "Hello" });
});

app.get("/subreddit/:subreddit", async (req,res)=> {
  const name = `r/${req.params.subreddit}`;
  if(!name) return res.status(400).json({error: "Missing subreddit name"})
  try {
console.log("QUERY NAME:", name);   const response= await pool.query(
      `SELECT subname, subcount, image FROM subreddit
      WHERE subname = $1`,[name]
    )
    const data = response.rows[0];
    if(!data) return res.status(404).json({error: "Subreddit not found!"})

    res.status(200).json({data})
  } catch(err) {

    res.status(500).json({error: err})
  }

})


app.get("/posts/:subreddit", async (req,res)=> {
  const name = `r/${req.params.subreddit}`;
  if(!name) return res.status(400).json({error: "Missing subreddit name"})
  try {
   const response= await pool.query(
      `SELECT* FROM subreddit
      WHERE subname = $1`,[name]
    )
    const data = response.rows[0];
    if(!data) return res.status(404).json({error: "Subreddit not found!"})

    res.status(200).json({data})
  } catch(err) {
    res.status(500).json({error: err})
  }

})

app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
console.log(process.env.DATABASE_URL);
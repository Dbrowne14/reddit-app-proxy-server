import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 4000;

// decide on the subreddits
const preLoadedSubReddits = [
  "educationalgifs",
  "perfectloops",
  "Cinemagraphs",
  "mechanical_gifs",
];

const findMedia = (post) => {
  const data = post.data;

  const crosspostRoot =
    data.crosspost_parent_list?.[0]?.secure_media;
  //rejection conditions
  const isGallery = crosspostRoot?.gallery_data || data.gallery_data;
  const isRemoved = data.removed_by_category !== null;

  if (isGallery || isRemoved) {
    return null;
  }


  // is a crosspost
  if (crosspostRoot?.reddit_video.fallback_url) {
    return {
      type: "video",
      url: crosspostRoot?.fallback_url,
      width: crosspostRoot?.width,
      height: crosspostRoot?.height,
    };
  }
  // is a video
  const videoRoot = data.secure_media?.reddit_video;
  if (videoRoot?.fallback_url) {
    return {
      type: "video",
      url: videoRoot?.fallback_url,
      height: videoRoot?.height,
      width: videoRoot?.width,
    };
  }
  // is a gif with acceptable format
  if (data.url_overridden_by_dest) {
    return {
      type: "gif",
      url: data.url_overridden_by_dest,
      width: data.preview?.images?.[0]?.source?.width,
      height: data.preview?.images?.[0]?.source?.height,
    };
  }

  // or return null
  return null;
};

// write some backend code

const subCheck = (req, res, next) => {
  const { subreddit } = req.params;
  if (!preLoadedSubReddits.includes(subreddit)) {
    return res.status(404).send(`Subreddit ${subreddit} does not exist`);
  }
  next();
};

//get the whole subreddit
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

app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));

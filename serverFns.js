// to find correct sub params

export const findImg = (sub) => {
    const data = sub.data;
    if(data.icon_img) {
        return data.icon_img;
    }
    if (data.community_icon) {
        const rawUrl = data.community_icon;
        return rawUrl.replace(/&amp;/g, "&");
    }
    return null
}   

//to find correct Media params
export const findMedia = (post) => {
  const data = post.data;

  const crosspostRoot = data.crosspost_parent_list?.[0]?.secure_media;

  //rejection conditions
  const isGallery =
    data.crosspost_parent_list?.[0]?.gallery_data ||
    crosspostRoot?.gallery_data ||
    data.gallery_data;
  const isRemoved =
    data.removed_by_category !== null ||
    crosspostRoot?.removed_by_category ||
    data.crosspost_parent_list?.[0]?.removed_by_category;
  const isUnpopular = data.upvote_ratio < 0.7;

  if (isGallery || isRemoved || isUnpopular) {
    return null;
  }

  // is a crosspost
  if (crosspostRoot?.reddit_video.fallback_url) {
    return {
      type: "video",
      url: crosspostRoot?.reddit_video?.fallback_url,
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

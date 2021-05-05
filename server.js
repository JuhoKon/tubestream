const app = require("express")();
const ytdl = require("ytdl-core");
const auth = require("./auth");
const cors = require("cors");

const getAudioStream = async (req, res) => {
  try {
    const { videoId } = req.params;
    const isValid = ytdl.validateID(videoId);

    if (!isValid) {
      throw new Error();
    }

    const videoInfo = await ytdl.getInfo(videoId);

    let audioFormat = ytdl.chooseFormat(videoInfo.formats, {
      filter: "audioonly",
      quality: "highestaudio",
    });

    const { itag, container, contentLength } = audioFormat;

    // define headers
    const rangeHeader = req.headers.range || null;

    const rangePosition = rangeHeader
      ? rangeHeader.replace(/bytes=/, "").split("-")
      : null;
    const startRange = rangePosition ? parseInt(rangePosition[0], 10) : 0;
    const endRange =
      rangePosition && rangePosition[1].length > 0
        ? parseInt(rangePosition[1], 10)
        : contentLength - 1;
    const chunksize = endRange - startRange + 1;

    res.writeHead(206, {
      "Content-Type": `audio/${container}`,
      "Content-Length": chunksize,
      "Content-Range":
        "bytes " + startRange + "-" + endRange + "/" + contentLength,
      "Accept-Ranges": "bytes",
    });

    const range = { start: startRange, end: endRange };
    const audioStream = ytdl(videoId, {
      filter: (format) => format.itag === itag,
      range,
    });
    audioStream.pipe(res);
  } catch (error) {
    console.log(error);
    return res.status(500).send();
  }
};
var corsOptions = {
  origin: ["http://localhost:3000", "https://tubepwa.herokuapp.com/"],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.get("/stream/:videoId", auth, getAudioStream);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Running on ${PORT}`);
});

const app = require("express")();
const ytdl = require("ytdl-core");
const auth = require("./auth");
const cors = require("cors");
const COOKIE =
  "VISITOR_INFO1_LIVE=0GEZlpfV7wE; CONSENT=YES+FI.fi+V11+BX; LOGIN_INFO=AFmmF2swRgIhAPuvwSQMMV4Yq0WLDJ85mrYiXW3-SbH_4GtZPi5ACP94AiEAhHXTkh8xfWpRc7fso9jlk7p4-6KjdmajovygQ0ILPeo:QUQ3MjNmekFDR3ZiWGF1d3MyaUlMN2duSF95SnNZVUs1Nm1tc3FseWlaX2ZhcDRBb3dXRDZ1azBKY0JxRFMzZHpBVnJBZ3l0WkNwRmtFOGNCeHpaNFlJZldNeDZUckpGSWE2anc1c0pscnl5YjdDUmtvWjJESDgxbGFzcVpHdDF0UVBKZVdtdkoyX0JuSzFoRjBMcEt3XzRFQ01OWkt0ZFItZ3pqM1d4b1o4Z0MyMVJjc2FBZWhn; YSC=F773h_kc30g; wide=1; _gcl_au=1.1.1857650955.1620485292; PREF=tz=Europe.Helsinki&f5=20000&volume=30; SID=9geGTbWOeuEeCDZ9rybRJpD5lcszAxUsgl-CqpXGNB4E3xSMGroZKvy4Pvql01p1KFn4Hw.; __Secure-3PSID=9geGTbWOeuEeCDZ9rybRJpD5lcszAxUsgl-CqpXGNB4E3xSMzAqCiWNhM3rK9NddtdVJew.; HSID=AY5YqfYfQjVzjmyx9; SSID=A4uf5h2QhtYTcsTuv; APISID=qSjdToLPexADpNGk/AmTFSKr7OvrL2OEYm; SAPISID=oZn_wPg4DdvHVZPF/Au906rdnmyqGxAT6d; __Secure-3PAPISID=oZn_wPg4DdvHVZPF/Au906rdnmyqGxAT6d; SIDCC=AJi4QfHILmkipLJ20F-lU6uCIDTgsYZBWL-dIujlOuSa3nW1i0PdSFKvNxnyMW29OU7-Hw7jxQ; __Secure-3PSIDCC=AJi4QfFKSHuOSC0Jm3BSprZ64jm1UfQcxx-ch4lytl7aEC1CPtCfHpC1n-j9a4dU1dWPhb5Y3qRV";
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
      headers: {
        cookie: COOKIE,
      },
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
  origin: ["http://localhost:3000", "https://tubepwa.herokuapp.com"],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.get("/stream/:videoId", getAudioStream);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Running on ${PORT}`);
});

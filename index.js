import http from "http";
import fs from "fs";
import path from "path";
import { Transform } from "stream";

const fsp = fs.promises;

const links = (arr, curUrl) => {
  if (curUrl.endsWith("/")) {
    curUrl = curUrl.substring(0, curUrl.length - 1);
  }

  return arr.map(item => `<li><a href="${curUrl}/${item}">${item}</a></li>`).join('');
};

const server = http.createServer((req, res) => {
  if (req.method === "GET") {
    const url = req.url.split("?")[0];
    const curPath = path.join(process.cwd(), url);

    fs.stat(curPath, (err, stats) => {
      if (!err) {
        if (stats.isFile(curPath)) {
          fs
            .createReadStream(curPath, "utf-8")
            .pipe(res);
        } else {
          fsp
            .readdir(curPath)
            .then((files) => {
              if (url !== "/") {
                files.unshift("..");
              }
              return files;
            })
            .then((data) => {
              const ts = new Transform({
                transform(chunk, encoding, callback) {
                  this.push(
                    chunk
                      .toString()
                      .replace("#filelinks#", links(data, url))
                  );

                  callback();
                },
              });

              const filePath = path.join(process.cwd(), "./index.html");
              fs
                .createReadStream(filePath)
                .pipe(ts)
                .pipe(res);
            });
        }
      } else {
        res.end("Path not exists");
      }
    });
  }
});

const host = "localhost";
const port = 3000;

server.listen(port, host, () =>
  console.log(`Server running at http://${host}:${port}`)
);

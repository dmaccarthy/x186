import express from 'express';
import util from './util.js';
import mjax from './mjax.js';

util.trust.hosts = ["dmaccarthy.github.io"];
util.view.dir = "views";

const app = express();

app.use(util.log);
app.use(express.static('public'));


/*** Request handlers ***/

app.get('/', (q, r) => util.respond(r, "txt", "Hello, world!"));
app.get('/about', (q, r) => util.file(r, "views/about.htm"));
app.get('/a.html', (q, r) => util.view(r, "a.html", {x: 1998}));
app.get('/a.txt', (q, r) => util.view(r, "a.txt", {x: 1998}));
app.get(/\/mjax\/.*\.svg/, util.trust, (q, r) => mjax.svg(q, r));

app.get("/utc.json", util.trust, (req, res) => {
/* Send server UTC time */
    let d = new Date();
    util.respond(res, "json", JSON.stringify({
        year: d.getUTCFullYear(), month: d.getUTCMonth()+1, day: d.getUTCDate(),
        hour: d.getUTCHours(), min: d.getUTCMinutes(), sec: d.getUTCSeconds(),
        msec: d.getUTCMilliseconds()}
    ));
});

app.post("/formecho", util.form, (req, res) => {
/* Echo the content of a form submission */
    let [fields, files] = req.formdata;
    let s = "Fields...\n";
    for (let k in fields) s += `${k}: ${fields[k][0]}\n`;
    let hasFiles = false;
    for (let k in files) {
        let f = files[k];
        if (f.filename) {
            if (!hasFiles) {
                s += "\nFiles...\n";
                hasFiles = true;
            }
            s += `${f.filename}: ${f.bytes} bytes\n`;
        }
    }
    // let fileData = util.form.buffer(req.formdata[1].file.data, "utf8");
    util.respond(res, "txt", s);
})


/*** Start server ***/

// app.listen(PORT, () => {console.log(`Server running on port ${PORT}.`)});

mjax.serve(app);

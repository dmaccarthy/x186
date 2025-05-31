import { readFile } from 'fs/promises';
import path from 'path';
import mime from 'mime';
import busboy from 'busboy';

const root = path.join(import.meta.dirname, '..');

function trusted(req, res, next) {
/* Check for trusted referers */
    let refer = req.headers.origin;
    if (refer) {
        let host = new URL(refer).host;
        if (trusted.hosts.indexOf(host) > -1)
            res.setHeader("Access-Control-Allow-Origin", `https://${host}`);
    }
    next();
}

function log(req, res, next) {
/* Log request after response is completed */
    res.on('finish', () => {
        let d = new Date().toUTCString().substring(5, 25);
        let m = `${req.method}`.padEnd(4, ' ');
        console.log(`[${d}] ${res.statusCode} - ${m} ${req.url}`);
    });
    next();
};

trusted.hosts = [];

function filePath(...f) {
/* Return file path from root directory */
    return path.join(root, ...f);
}

function respond(r, type, content, code) {
/* Send response headers, status code, and content */
    r.setHeader("Content-Type", mime.getType(type));
    r.statusCode = code ? code : 200;
    return r.end(content);
}

async function render(template, _) {
    return readFile(path.join(root, sendView.dir, template), "utf8").then((a) => {
        let s = "";
        a = a.split("@@");
        for (let i=0;i<a.length;i++)
            s += i % 2 ? eval(a[i]) : a[i];
        return [s, 200];
    }, (a) => {
        console.log(a);
        return ["Not Found", 404];
    });
}

function sendView(r, template, data) {
    render(template, data).then((a) => respond(r, template, ...a));  
}

function formdata(req, res, next) {
/* Get form data using npmjs.com/package/busboy */
    let fields = {};
    let files = {};
    req.formdata = [fields, files];
    let bb = busboy({headers: req.headers});
    bb.on('file', (name, file, info) => {
        let {filename, encoding, mimeType} = info;
        let finfo = files[name] = {filename: filename, bytes: 0, data: [], encoding: encoding, mimeType: mimeType}
        file.on('data', (data) => {
            finfo.data.push(data);
            finfo.bytes += data.length;
        });
    });
    bb.on('field', (name, val, info) => {
        fields[name] = [val, info];
    });
    bb.on('close', next);
    req.pipe(bb);
}

formdata.buffer = (chunks, decoder) => {
/* Convert byte chunks (e.g. form data) into a
    Uint8Array and optionally decode into text */
    let n = 0;
    // if (!(chunks instanceof Array)) chunks = chunks.formdata[1];
    for (let item of chunks) n += item.length;
    let view = new Uint8Array(new ArrayBuffer(n));
    let i = 0;
    for (let item of chunks) {
        view.set(item, i);
        i += item.length;
    }
    return decoder ? new TextDecoder(decoder).decode(view) : view;    
}

export default {
    trust: trusted,
    log: log,
    view: sendView,
    render: render,
    path: filePath,
    respond: respond,
    file: (r, ...f) => {r.sendFile(filePath(...f))},
    form: formdata,
};

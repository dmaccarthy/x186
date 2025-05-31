import mathjax from 'mathjax';

var _mj;

async function mjax(tex) {
/* Render TeX to SVG */
    return _mj.tex2svgPromise(tex).then((node) => {
        node = node.children[0];
        let svg = _mj.startup.adaptor.outerHTML(node);
        return new Promise((resolve) => resolve(svg));
    });
}

function svg(req, res) {
/* Use MathJax to render as SVG */
    let cc = req.query.color;
    mjax(req.query.tex).then((svg) => {
        if (cc) svg = svg.replaceAll(`"currentColor"`, `"${cc}"`);
        res.writeHeader(200, {"Content-Type": "image/svg+xml"});
        res.end(svg);
    });
}

function serve(app, port) {
    if (!port) port = 3000;
    mathjax.init({
        loader: {load: ['input/tex', 'output/svg']}
    }).then((mj) => {
        _mj = mj;
        app.listen(port, () => {console.log(`Server running on port ${port}.`)});
    });
};

export default {
    serve: serve,
    svg: svg,
};

define([ ], function () {
    function reportGLError(gl, error) {
        // Find the error name
        for (var key in gl) {
            // Include properties of prototype
            if (gl[key] === error) {
                throw new Error("GL error " + key + " (code " + error + ")");
            }
        }

        // Couldn't find it; whatever
        throw new Error("GL error code " + error);
    }

    function checkGLError(gl) {
        var error = gl.getError();
        if (error !== 0) {
            reportGLError(gl, error);
        }
    }

    function wrapGL(gl) {
        if (gl.orig) {
            return gl;
        }

        var wrapped = {
            orig: gl
        };

        function wrap(key) {
            return function () {
                var ret = gl[key].apply(gl, arguments);
                checkGLError(gl);
                return ret;
            };
        }

        for (var key in gl) {
            // Include properties of prototype
            if (typeof gl[key] === 'function') {
                wrapped[key] = wrap(key);
            } else {
                wrapped[key] = gl[key];
            }
        }

        return wrapped;
    }

    function makeTexture(gl, image) {
        var texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_2D, null);

        return texture;
    }

    var createProgram;
    (function () {
        /*jshint white: false, eqeqeq: false, eqnull: true */

        // Taken from owp
        // https://github.com/strager/owp/
        //
        // which took from webgl-boilerplate
        // https://github.com/jaredwilli/webgl-boilerplate/

        function createShader( gl, src, type ) {

            var shader = gl.createShader( type );

            gl.shaderSource( shader, src );
            gl.compileShader( shader );

            if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {

                throw new Error( ( type == gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT" ) + " SHADER:\n" + gl.getShaderInfoLog( shader ) + "\nSOURCE:\n" + src );

            }

            return shader;

        }

        createProgram = function createProgram( gl, vertex, fragment ) {

            var program = gl.createProgram();

            var vs = createShader( gl, vertex, gl.VERTEX_SHADER );
            var fs = createShader( gl, '#version 100\n#ifdef GL_ES\nprecision highp float;\n#endif\n\n' + fragment, gl.FRAGMENT_SHADER );

            if ( vs == null || fs == null ) return null;

            gl.attachShader( program, vs );
            gl.attachShader( program, fs );

            gl.deleteShader( vs );
            gl.deleteShader( fs );

            gl.linkProgram( program );

            if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {

                throw new Error( "ERROR:\n" +
                "VALIDATE_STATUS: " + gl.getProgramParameter( program, gl.VALIDATE_STATUS ) + "\n" +
                "ERROR: " + gl.getError() + "\n\n" +
                "- Vertex Shader -\n" + vertex + "\n\n" +
                "- Fragment Shader -\n" + fragment );

            }

            return program;

        };
    }());

    function getContext(canvas, options) {
        var context;
        try {
            context = canvas.getContext('webgl', options);
            if (!context) {
                throw new Error();
            }
        } catch (e) {
            try {
                context = canvas.getContext('experimental-webgl', options);
                if (!context) {
                    throw new Error();
                }
            } catch (e) {
                throw new Error("WebGL not supported");
            }
        }

        return context;
    }

    return {
        wrapGL: wrapGL,
        makeTexture: makeTexture,
        createProgram: createProgram,
        getContext: getContext
    };
});

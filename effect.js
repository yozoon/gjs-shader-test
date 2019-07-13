const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Clutter = imports.gi.Clutter;
const ByteArray = imports.byteArray;

// Source: https://stackoverflow.com/a/21146281
function readShaderFile(filename) {
    let input_file = Gio.file_new_for_path(filename);
    let size = input_file.query_info(
        "standard::size",
        Gio.FileQueryInfoFlags.NONE,
        null).get_size();
    let stream = input_file.read(null);
    let data = stream.read_bytes(size, null).get_data();
    stream.close(null);
    return ByteArray.toString(data);
}

var kawase_down_shader = readShaderFile("kawase_down.glsl");
var kawase_up_shader = readShaderFile("kawase_up.glsl");

var KawaseDown = GObject.registerClass(
    class KawaseDown extends Clutter.ShaderEffect {
        _init(width, height, ox, oy) {
            // Initialize the parent instance
            super._init({shader_type: Clutter.ShaderType.FRAGMENT_SHADER});
            this.set_shader_source(kawase_down_shader);

            // Store params
            this.width = width;
            this.height = height;
            this.ox = ox;
            this.oy = oy;
            this.hpx = 0.5/width;
            this.hpy = 0.5/height;

            // Set shader values
            this.set_uniform_value('offsetx', parseFloat(this.ox));
            this.set_uniform_value('offsety', parseFloat(this.oy));
            this.set_uniform_value('halfpixelx', parseFloat(this.hpx));
            this.set_uniform_value('halfpixely', parseFloat(this.hpy));
        }
    }
);

var KawaseUp = GObject.registerClass(
    class KawaseUp extends Clutter.ShaderEffect {
        _init(width, height, ox, oy) {
            // Initialize the parent instance
            super._init({shader_type: Clutter.ShaderType.FRAGMENT_SHADER});

            // Read shader and set it as source
            this.set_shader_source(kawase_up_shader);

            // Store params
            this.width = width;
            this.height = height;
            this.ox = ox;
            this.oy = oy;
            this.hpx = 0.5/width;
            this.hpy = 0.5/height;

            // Set shader values
            this.set_uniform_value('offsetx', parseFloat(this.ox));
            this.set_uniform_value('offsety', parseFloat(this.oy));
            this.set_uniform_value('halfpixelx', parseFloat(this.hpx));
            this.set_uniform_value('halfpixely', parseFloat(this.hpy));
        }
    }
);
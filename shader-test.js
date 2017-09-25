#!/usr/bin/gjs
const Gtk = imports.gi.Gtk;
const Clutter = imports.gi.Clutter;
const GtkClutter = imports.gi.GtkClutter;
const Lang = imports.lang;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;

const ShaderEffect = new Lang.Class({
    Name : 'ShaderEffect',

    _init : function() {
        this.SHADER = this._read_shader_file("shader.glsl").toString();
        this.shader_effect = {};
        this._fetch_settings();
    },

    // Source: https://stackoverflow.com/a/21146281
    _read_shader_file : function(filename) {
        let input_file = Gio.file_new_for_path(filename);
        let size = input_file.query_info(
            "standard::size",
            Gio.FileQueryInfoFlags.NONE,
            null).get_size();
        let stream = input_file.read(null);
        let data = stream.read_bytes(size, null).get_data();
        stream.close(null);
        return data;
    },

    _fetch_settings : function() {
        this.radius = 10.0001;
        this.dim = false;
        this.brightness = 0.9999;
    },

    _create_shaders : function(actors) {
        let effect;
        for(let i = 0; i < actors.length; i++) {
            // Create new Shader Effect if it doesn't already exists
            if(typeof this.shader_effect[i] == 'undefined') {
                // Create Shader
                this.shader_effect[i] = [
                    new Clutter.ShaderEffect({
                        shader_type: Clutter.ShaderType.FRAGMENT_SHADER
                    }),
                    new Clutter.ShaderEffect({
                        shader_type: Clutter.ShaderType.FRAGMENT_SHADER
                    })
                ];
                effect = this.shader_effect[i];
                // Horizontal Shader
                effect[0].set_shader_source(this.SHADER);
                effect[0].set_uniform_value('dir', 0.0);
                effect[0].set_uniform_value('width', actors[i].get_width());
                effect[0].set_uniform_value('height', actors[i].get_height());
                effect[0].set_uniform_value('radius', this.radius);
                effect[0].set_uniform_value('brightness', 0.9999); // Do not dim horizontal pass
                // Vertical Shader
                effect[1].set_shader_source(this.SHADER);
                effect[1].set_uniform_value('dir', 1.0);
                effect[1].set_uniform_value('width', actors[i].get_width());
                effect[1].set_uniform_value('height', actors[i].get_height());
                effect[1].set_uniform_value('radius', this.radius);
                effect[1].set_uniform_value('brightness', this.brightness);
            } else {
                effect = this.shader_effect[i];
                // Horizontal Shader
                effect[0].set_uniform_value('width', actors[i].get_width());
                effect[0].set_uniform_value('height', actors[i].get_height());
                effect[0].set_uniform_value('radius', this.radius);
                // Vertical Shader
                effect[1].set_uniform_value('width', actors[i].get_width());
                effect[1].set_uniform_value('height', actors[i].get_height());
                effect[1].set_uniform_value('radius', this.radius);
                effect[1].set_uniform_value('brightness', this.brightness);
            }
        }
    },

    _apply_shaders : function(actors) {
        for(let i = 0; i < actors.length; i++) {
            // Apply Shader Effect
            if(!actors[i].get_effect("horizontal_blur"))
                actors[i].add_effect_with_name("horizontal_blur",this.shader_effect[i][0]);
            if(!actors[i].get_effect("vertical_blur"))
                actors[i].add_effect_with_name("vertical_blur", this.shader_effect[i][1]);
        }
    },

    apply_effect : function(actors) {
        this._fetch_settings();
        this._create_shaders(actors, false);
        this._apply_shaders(actors);
    },

    remove_effect : function(actors) {
        for(let i = 0; i < actors.length; i++) {
            if(actors[i].get_effect("horizontal_blur"))
                actors[i].remove_effect_by_name("horizontal_blur");
            if(actors[i].get_effect("vertical_blur"))
                actors[i].remove_effect_by_name("vertical_blur");
        }
    }
});

function onDeleteEvent(widget, event) {
    return false;
}

function onDestroy(widget) {
    Gtk.main_quit();
}

// spawnCommandLine:
// @command_line: a command line
//
// Runs @command_line in the background, handling any errors that
// occur when trying to parse or start the program.
function spawnCommandLine(command_line) {
    try {
        let [success, argv] = GLib.shell_parse_argv(command_line);
        trySpawn(argv);
    } catch (err) {
        _handleSpawnError(command_line, err);
    }
}

// trySpawn:
// @argv: an argv array
//
// Runs @argv in the background. If launching @argv fails,
// this will throw an error.
function trySpawn(argv)
{
    var success, pid, out;
    try {
        [success, pid] = GLib.spawn_sync(null, argv, null,
                                          GLib.SpawnFlags.SEARCH_PATH,
                                          null, null, out);
    } catch (err) {
        /* Rewrite the error in case of ENOENT */
        if (err.matches(GLib.SpawnError, GLib.SpawnError.NOENT)) {
            throw new GLib.SpawnError({ code: GLib.SpawnError.NOENT,
                                        message: _("Command not found") });
        } else if (err instanceof GLib.Error) {
            // The exception from gjs contains an error string like:
            //   Error invoking GLib.spawn_command_line_async: Failed to
            //   execute child process "foo" (No such file or directory)
            // We are only interested in the part in the parentheses. (And
            // we can't pattern match the text, since it gets localized.)
            let message = err.message.replace(/.*\((.+)\)/, '$1');
            throw new (err.constructor)({ code: err.code,
                                          message: message });
        } else {
            throw err;
        }
    }
    log(out);
}

function _handleSpawnError(command, err) {
    let title = _("Execution of “%s” failed:").format(command);
    log(title +": " + err.message);
}

Gtk.init(null);
GtkClutter.init(null, 0);
Clutter.init(null, 0);

spawnCommandLine("uname -r");

let shaderEffect = new ShaderEffect();

// create a new window
let win = new Gtk.Window({ type: Gtk.WindowType.TOPLEVEL });

win.connect("delete-event", onDeleteEvent);
win.connect("destroy", onDestroy);

// Create grid which contains the UI
var grid = new Gtk.Grid({ 
    row_spacing : 15,
    vexpand : false 
});

// Create Clutter GTK Widget
let embed = new GtkClutter.Embed();
embed.set_size_request(800, 200);

// Create Clutter.Texture from image
let texture = [];
texture[0] = new Clutter.Texture({
    filename: 'kingscanyon.png',
    width : 800
});

shaderEffect.apply_effect(texture, 10.0);
let stage = embed.get_stage();
stage.add_child(texture[0]);

grid.attach(embed, 0, 0, 1, 1);

win.add(grid);
grid.show_all();
win.show();

Gtk.main();
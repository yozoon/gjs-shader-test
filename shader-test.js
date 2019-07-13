#!/usr/bin/gjs
imports.gi.versions.Gtk = '3.0';
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const Clutter = imports.gi.Clutter;
const GObject = imports.gi.GObject;
const GtkClutter = imports.gi.GtkClutter;
const Mainloop = imports.mainloop;

imports.searchPath.unshift('.');
const Effect = imports.effect;

var UPDATE_TIMEOUT = 500;

class TestApp {
    constructor(width=800, height=200, image_file='kingscanyon.png') {
        Gtk.init(null);
        GtkClutter.init(null);
        Clutter.init(null);

        this.width = width;
        this.height = height;
        this.image_file = image_file;

        this.win = null;
        this.grid = null;
        this.offset_scale = null;
        this.iter_scale = null;
        this.offset_label = null;
        this.iter_label = null;
        this.texture = null;
        this.embed = null;
        this.stage = null;
        
        this.iter_timeout = null
        this.offset_timeout = null;

        this.iter = 0;
        this.offset = 0;

        this._create_ui();
        this._connect_callbacks();
    }

    _create_ui() {
        // create a new window
        this.win = new Gtk.Window({
            type: Gtk.WindowType.TOPLEVEL
        });

        // Create grid which contains the UI
        this.grid = new Gtk.Grid({
            row_spacing : 0,
            vexpand : true 
        });

        // Scale for changing offset value
        this.offset_scale = new Gtk.Scale({
            digits: 0,
            draw_value: true,
            value_pos: Gtk.PositionType.LEFT
        });

        // Scale for changing iterations
        this.iter_scale = new Gtk.Scale({
            digits: 0,
            draw_value: true,
            value_pos: Gtk.PositionType.LEFT
        });

        // Create Clutter.Texture from image
        this.texture = new Clutter.Texture({
            filename: this.image_file,
            width: this.width,
            height: this.height
        });

        this.offset_label = new Gtk.Label({
            halign : Gtk.Align.END, label: "offset:"
        });

        this.iter_label = new Gtk.Label({
            halign : Gtk.Align.END, label: "iterations:"
        });

        // Create Clutter GTK Widget
        this.embed = new GtkClutter.Embed();

        this.offset_scale.set_range(0, 40);
        this.iter_scale.set_range(0, 40);

        this.embed.set_size_request(this.width, this.height);

        this.stage = this.embed.get_stage();

        this.stage.add_child(this.texture);

        this.grid.attach(this.offset_label, 0, 0, 1, 1);
        this.grid.attach(this.offset_scale, 1, 0, 1, 1);
        this.grid.attach(this.iter_label, 2, 0, 1, 1);
        this.grid.attach(this.iter_scale, 3, 0, 1, 1);
        this.grid.attach(this.embed, 0, 1, 6, 1);

        this.win.add(this.grid);
    }

    _connect_callbacks() {
        this.win.connect("delete-event", this._delete.bind(this));
        this.win.connect("destroy", this.destroy.bind(this));
        this.offset_scale.connect('change-value', this._offset_changed.bind(this));
        this.iter_scale.connect('change-value', this._iter_changed.bind(this));
    }

    _apply_blur(actor) {
        this._remove_blur(actor);
        if(this.offset < 1)
            this.offset = 1

        for(let i = 0; i<this.iter; i++) {
            let down_fx = new Effect.KawaseDown(actor.width, actor.height, this.offset, this.offset);
            let up_fx = new Effect.KawaseUp(actor.width, actor.height, this.offset, this.offset);
            actor.add_effect(down_fx);
            actor.add_effect(up_fx);
            down_fx = null;
            up_fx = null;
        }
        print("Num shaders: " + actor.get_effects().length);
    }

    _remove_blur(actor) {
        actor.get_effects().forEach(function(effect) {
            actor.remove_effect(effect);
            effect = null;
        });
        actor.clear_effects();
    }

    _offset_changed(widget) {
        let value = widget.get_value();
        if(this.offset_timeout)
            Mainloop.source_remove(this.offset_timeout);

        this.offset_timeout = Mainloop.timeout_add(UPDATE_TIMEOUT,
            function(value) {
                this.offset = value;
                print("offset: " + this.offset + " iterations: " + this.iter);
                this.offset_timeout = null;
                this._apply_blur(this.texture);
                return GLib.SOURCE_REMOVE;
            }.bind(this, value)
        );
    }

    _iter_changed(widget) {
        let value = widget.get_value();
        if(this.iter_timeout)
            Mainloop.source_remove(this.iter_timeout);

        this.iter_timeout = Mainloop.timeout_add(UPDATE_TIMEOUT,
            function(value) {
                this.iter = value;
                print("offset: " + this.offset + " iterations: " + this.iter);
                this.offset_timeout = null;
                this._apply_blur(this.texture);
                return GLib.SOURCE_REMOVE;
            }.bind(this, value)
        );
    }

    _delete(widget, event) {
        return false;
    }

    destroy(widget) {
        Mainloop.quit();
    }

    run() {
        this.grid.show_all();
        this.win.show();
        Mainloop.run();
    }
}

var app = new TestApp(800, 200, 'kingscanyon.png');
app.run();
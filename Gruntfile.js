module.exports = function(grunt) {
  require('time-grunt')(grunt);

  var target = grunt.option('target') || 'dev';
  var foswikiBase = grunt.option('foswiki') || '/opt/qwiki';
  var checkoutBase = grunt.option('git') || '/opt/git';

  var pkg = grunt.file.readJSON('package.json');
  var isPlugin = /Plugin$/.test( pkg.name );
  pkg.pubDir = 'pub/System/' + pkg.name;
  pkg.dataDir = 'data/System';
  pkg.libDirBase = 'lib/Foswiki/' + (isPlugin ? 'Plugins/': 'Contrib/');
  pkg.libDir = pkg.libDirBase + pkg.name;

  try {
    var bowerrc = grunt.file.readJSON('.bowerrc');
    pkg.bower = bowerrc.directory;
  } catch( e ) {
    pkg.bower = 'bower_components'
  }

  grunt.initConfig({
    pkg: pkg,

    clean: {
      css: ["<%= pkg.pubDir %>/css/*.css"],
      fonts: ["<%= pkg.pubDir %>/fonts/*"],
      js: ["<%= pkg.pubDir %>/js/*.js"],
      manifest: ["manifest.tmp"],
      swf: ["<%= pkg.pubDir %>/swf/*.swf"]
    },

    copy: {
      fonts: {
        files: [
          {
            expand: true,
            cwd: pkg.bower + '/videojs/dist/video-js/font/',
            src: '**',
            dest: '<%= pkg.pubDir %>/fonts/',
            flatten: true,
            filter: 'isFile',
            mode: 0644
          }
        ]
      },
      manifest: {
        files: [
          {
            src: ['manifest.tmp'],
            dest: '<%= pkg.libDir %>/MANIFEST',
            mode: 0644
          }
        ]
      },
      swf: {
        files: [
          {
            src: pkg.bower + '/videojs/dist/video-js/video-js.swf',
            dest: '<%= pkg.pubDir %>/swf/video-js.swf',
            filter: 'isFile',
            mode: 0644
          }
        ]
      }
    },

    exec: {
      install: {
        cmd: function() {
          var cmd = [
            'cd ' + foswikiBase,
            './pseudo-install.pl ' + pkg.name
          ];

          return cmd.join( '&&' );
        }
      }
    },

    'file-creator': {
      options: {
        openFlags: 'w'
      },
      'create-manifest-tmp': {
        'manifest.tmp': function( fs, handle, done ) {
          var glob = grunt.file.glob;
          var _ = grunt.util._;

          var ignore = [
            pkg.bower,
            'node_modules/',
            'Gruntfile.js',
            'src/',
            '.git/',
            '.gitignore',
            '.bowerrc',
            '.cache/',
            'build.pl',
            'README.md',
            'MANIFEST',
            'package.json',
            'bower.json',
            'manifest.tmp'
          ];

          glob( '**/*', function ( err, files ) {
            var entries = [];
            _.each( files, function( file ) {
              for ( var i = 0; i < ignore.length; ++i ) {
                if ( file.indexOf( ignore[i] ) > -1 )
                  return;

                if ( grunt.file.isDir( file ) )
                  return;
              }

              entries.push( file );
            });

            entries.push( '' );
            fs.writeSync( handle, entries.join( ' 0644\n' ) );
            done();
          });
        }
      }
    },

    less: {
      dev: {
        options: {
          compress: false
        },
        files: {
          "<%= pkg.pubDir %>/css/qwiki.video.css": [
            "<%= pkg.bower %>/videojs/src/css/video-js.less",
            "<%= pkg.pubDir %>/src/less/video-js.qiki.less"
          ]
        }
      },
      dist: {
        options: {
          cleancss: true,
          compress: true
        },
        files: {
          "<%= pkg.pubDir %>/css/qwiki.video.min.css": [
            "<%= pkg.bower %>/videojs/src/css/video-js.less",
            "<%= pkg.pubDir %>/src/less/video-js.qiki.less"
          ]
        }
      }
    },

    jshint: {
      options: {
        browser: true,
        curly: true,
        eqeqeq: true,
        eqnull: true,
        // laxbreak: true,
        reporter: require('jshint-stylish'),
        globals: {
          jQuery: true
        },
      },
      beforeconcat: ['<%= pkg.pubDir %>/src/js/**/*.js']
    },

    todo: {
      options: {
        marks: [
          {
            name: 'tbd',
            pattern: /tbd/i,
            color: "orange"
          },{
            name: 'fixme',
            pattern: /fixme/i,
            color: "red"
          },
          {
            name: "todo",
            pattern: /todo/i,
            color: "yellow"
          }
        ],
      },
      src: ['<%= pkg.pubDir %>/src/**/*', '<%= pkg.libDirBase %>/**/*.pm']
    },

    uglify: {
      dev: {
        options: {
          beautify: true,
          compress: false,
          mangle: false,
          preserveComments: 'all'
        },
        files: {
          '<%= pkg.pubDir %>/js/qwiki.video.js': [
            '<%= pkg.bower %>/videojs/dist/video-js/video.dev.js',
            '<%= pkg.pubDir %>/src/js/**/*.js'
          ],
        }
      },
      dist: {
        options: {
          compress: true,
          mangle: true,
          preserveComments: false
        },
        files: [{
          '<%= pkg.pubDir %>/js/qwiki.video.min.js': [
            '<%= pkg.bower %>/videojs/dist/video-js/video.dev.js',
            '<%= pkg.pubDir %>/src/js/**/*.js'
          ]
        }]
      }
    },

    watch: {
      options: {
        interrupt: true,
      },
      grunt: {
        files: ['Gruntfile.js']
      },
      sass: {
        files: ['<%= pkg.pubDir %>/src/less/**/*.less'],
        tasks: ['less:' +  target]
      },
      uglify: {
        files: ['<%= pkg.pubDir %>/src/js/**/*.js'],
        tasks: ['jshint','uglify:' + target]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-file-creator');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-todo');

  grunt.registerTask('default', ['build', 'watch']);
  grunt.registerTask('install', ['clean', 'build', 'manifest', 'pseudo-install']);
  grunt.registerTask('prepare-manifest', ['file-creator:create-manifest-tmp']);
  grunt.registerTask('manifest', ['prepare-manifest', 'copy:manifest', 'clean:manifest']);
  grunt.registerTask('pseudo-install', ['exec:install']);
  grunt.registerTask('build', [
    'copy:fonts',
    'copy:swf',
    'less:' + target,
    'jshint',
    'uglify:' + target
  ]);
}

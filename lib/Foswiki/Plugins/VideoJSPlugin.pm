package Foswiki::Plugins::VideoJSPlugin;

use strict;
use warnings;

use Foswiki::Func;
use Foswiki::Plugins;

use version;
our $VERSION = version->declare( '1.0.0' );
our $RELEASE = '1.0.0';
our $NO_PREFS_IN_TOPIC = 1;
our $SHORTDESCRIPTION = 'HTML5 Video Playback';

sub initPlugin {
  my ( $topic, $web, $user, $installWeb ) = @_;

  my $context = Foswiki::Func::getContext();
  return 1 unless $context->{view};

  if ( $Foswiki::Plugins::VERSION < 2.0 ) {
      Foswiki::Func::writeWarning( 'Version mismatch between ',
          __PACKAGE__, ' and Plugins.pm' );
      return 0;
  }

  Foswiki::Func::registerTagHandler( 'VIDEOJS', \&_handleVIDEO );
  return 1;
}

sub _handleVIDEO {
  my( $session, $params, $topic, $web, $topicObject ) = @_;

  my $link = $params->{_DEFAULT};
  my $width = $params->{width} || 640;
  my $height = $params->{height} || 264;
  return '' unless $link;

  my $ext = $1 if $link =~ m/\.(.{1,4})$/;
  return '' unless $ext;

  my $tag = <<"TAG";
<div class="qwiki-video">
  <video class="video-js vjs-default-skin vjs-big-play-centered" controls preload="auto" width="$width" height="$height">
    <source src="$link" type='video/$ext' />
    <p class="vjs-no-js">
      To view this video please enable JavaScript, and consider upgrading to a web browser that <a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>
    </p>
  </video>
</div>
TAG

  _attachHead();
  return $tag;
}

sub _attachHead {
  my $path = "%PUBURLPATH%/%SYSTEMWEB%/VideoJSPlugin";
  my $dev = $Foswiki::cfg{Plugins}{VideoJSPlugin}{Debug} || 0;
  my $suffix = $dev ? '' : '.min';
  my $styles = <<STYLES;
<link rel="stylesheet" type="text/css" href="$path/css/qwiki.video$suffix.css" />
STYLES

  my $scripts = <<SCRIPTS;
<script type="text/javascript" src="$path/js/qwiki.video$suffix.js"></script>
<script>videojs.options.flash.swf = "$path/swf/video-js.swf"</script>
SCRIPTS

  Foswiki::Func::addToZone( 'head', 'VIDEOJSPLUGIN::STYLES', $styles );
  Foswiki::Func::addToZone( 'script', 'VIDEOJSPLUGIN::SCRIPTS', $scripts, 'JQUERYPLUGIN::FOSWIKI' );
}

1;

__END__
Foswiki - The Free and Open Source Wiki, http://foswiki.org/

Author: Modell Aachen GmbH <http://www.modell-aachen.de>

Copyright (C) 2009-2014 Foswiki Contributors. Foswiki Contributors
are listed in the AUTHORS file in the root of this distribution.
NOTE: Please extend that file, not this notice.

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version. For
more details read LICENSE in the root of this distribution.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

As per the GPL, removal of this notice is prohibited.

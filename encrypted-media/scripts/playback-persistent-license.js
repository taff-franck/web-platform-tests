function runTest(config,qualfier) {

    var testname = ( qualifier || '' ) + config.keysystem
                                    + ', successful playback, persistent-license, '
                                    + /video\/([^;]*)/.exec( config.videoType )[ 1 ]
                                    + ', set src before setMediaKeys';

    var configuration = {   initDataTypes: [ config.initDataType ],
                            audioCapabilities: [ { contentType: config.audioType } ],
                            videoCapabilities: [ { contentType: config.videoType } ],
                            sessionTypes: [ 'persistent-license' ] };


    async_test( function( test ) {

        var _video = config.video,
            _mediaKeys,
            _mediaKeySession,
            _mediaSource,
            _startedReleaseSequence = false;

        function onFailure(error) {
            forceTestFailureFromPromise(test, error);
        }

        function onMessage(event) {
            assert_equals( event.target, _mediaKeySession );
            assert_true( event instanceof window.MediaKeyMessageEvent );
            assert_equals( event.type, 'message');

            if ( !_startedReleaseSequence ) {
                assert_in_array( event.messageType, [ 'license-request', 'individualization-request' ] );
            } else {
                assert_equals( event.messageType, 'license-release' );
            }

            config.messagehandler( event.messageType, event.message )
            .then( function( response ) {
                _mediaKeySession.update( response )
                .catch(onFailure);
            });
        }

        function onEncrypted(event) {
            assert_equals(event.target, _video);
            assert_true(event instanceof window.MediaEncryptedEvent);
            assert_equals(event.type, 'encrypted');

            waitForEventAndRunStep('message', _mediaKeySession, onMessage, test);
            _mediaKeySession.generateRequest(   config.initData ? config.initDataType : event.initDataType,
                                                config.initData || event.initData ).catch(onFailure);
        }

        function onTimeupdate(event) {
            if ( _video.currentTime > ( config.duration || 2 ) && !_startedReleaseSequence ) {
                _video.removeEventListener('timeupdate', onTimeupdate );
                _video.pause();
                _video.removeAttribute('src');
                _video.load();

                _startedReleaseSequence = true;

                _mediaKeySession.closed.then( function() { test.done(); } );
                _mediaKeySession.remove().catch(onFailure);
            }
        }

        function onPlaying(event) {
            // Not using waitForEventAndRunStep() to avoid too many
            // EVENT(onTimeUpdate) logs.
            _video.addEventListener('timeupdate', onTimeupdate, true);
        }

        navigator.requestMediaKeySystemAccess(config.keysystem, [ configuration ]).then(function(access) {
            return access.createMediaKeys();
        }).then(function(mediaKeys) {
            _mediaKeys = mediaKeys;
            return _video.setMediaKeys(_mediaKeys);
        }).then(function() {
            _mediaKeySession = _mediaKeys.createSession( 'persistent-license' );

            waitForEventAndRunStep('encrypted', _video, onEncrypted, test);
            waitForEventAndRunStep('playing', _video, onPlaying, test);
        }).then(function() {
            return testmediasource(config);
        }).then(function(source) {
            _mediaSource = source;
            _video.src = URL.createObjectURL(_mediaSource);
            _video.play();
        }).catch(onFailure);
    }, testname);
}

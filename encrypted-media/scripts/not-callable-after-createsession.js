 function runTest(config,qualifier) {
    // After creation, the MediaKeySession object is not
    // callable, and we should get a InvalidStateError.

    promise_test(function()
    {
        return navigator.requestMediaKeySystemAccess(config.keysystem, getSimpleConfiguration()).then(function(access) {
            return access.createMediaKeys();
        }).then(function(mediaKeys) {
            var mediaKeySession = mediaKeys.createSession();

            var arbitraryResponse = new Uint8Array([0x00, 0x11]);
            return mediaKeySession.update(arbitraryResponse).then(function(result) {
                assert_unreached('update() succeeded unexpectedly.');
            }).catch(function(error) {
                assert_equals(error.name, 'InvalidStateError');
            });
        });
    }, ( qualifier || '' ) + config.keysystem + ': Update() immediately after CreateSession().');

    promise_test(function()
    {
        return navigator.requestMediaKeySystemAccess(config.keysystem, getSimpleConfiguration()).then(function(access) {
            return access.createMediaKeys();
        }).then(function(mediaKeys) {
            var mediaKeySession = mediaKeys.createSession();

            return mediaKeySession.close().then(function(result) {
                assert_unreached('close() succeeded unexpectedly.');
            }).catch(function(error) {
                assert_equals(error.name, 'InvalidStateError');
            });
        });
    }, ( qualifier || '' ) + config.keysystem + ': Close() immediately after CreateSession().');

    promise_test(function()
    {
        return navigator.requestMediaKeySystemAccess(config.keysystem, getSimpleConfiguration()).then(function(access) {
            return access.createMediaKeys();
        }).then(function(mediaKeys) {
            var mediaKeySession = mediaKeys.createSession();

            return mediaKeySession.remove().then(function(result) {
                assert_unreached('remove() succeeded unexpectedly.');
            }).catch(function(error) {
                assert_equals(error.name, 'InvalidStateError');
            });
        });
    }, ( qualifier || '' ) + config.keysystem + ': Remove() immediately after CreateSession().');
}

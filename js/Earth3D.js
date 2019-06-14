var Earth3D = Earth3D || {};

Earth3D.lastTimeMsec = null;
Earth3D.updateFcts = [];
Earth3D.earth = null;
Earth3D.visible = false;

Earth3D.init = function(canvasName) {
    let canvas = document.getElementById(canvasName);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    var renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    var aspect = width / height;
    renderer.setSize(width, height);
    renderer.shadowMap.Enabled = true

    var scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0, 50);
    camera.zoom = 0.3;

    var light = new THREE.AmbientLight(0x555555)
    scene.add(light)

    var light = new THREE.DirectionalLight(0xcccccc, 1)
    light.position.set(5, 5, 4)
    scene.add(light)
    light.castShadow = true
    light.shadow.camera.near = 0.01
    light.shadow.camera.far = 15
    light.shadow.camera.fov = 45

    light.shadow.camera.left = -1
    light.shadow.camera.right = 1
    light.shadow.camera.top = 1
    light.shadow.camera.bottom = -1

    light.shadow.bias = 0.001
        //light.shadowDarkness = 0.2

    light.shadow.mapSize.width = 1024
    light.shadow.mapSize.height = 1024

    //////////////////////////////////////////////////////////////////////////////////
    //		add an object and make it move					//
    //////////////////////////////////////////////////////////////////////////////////

    //var controls = new THREE.OrbitControls(camera, renderer.domElement);
    //controls.update();

    var plane = new THREE.Plane();
    plane = plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1));

    /*
    var helper = new THREE.PlaneHelper(plane, 2, 0xffff00);
    scene.add(helper);
    */

    var containerEarth = new THREE.Object3D();
    containerEarth.rotation.x = 10 * Math.PI / 180;
    containerEarth.position.x = 0;
    containerEarth.position.z = -1;
    containerEarth.visible = Earth3D.visible;
    scene.add(containerEarth);

    var earthMesh = THREEx.Planets.createEarth();
    Earth3D.updateFcts.push(function(delta, now) {
        earthMesh.rotation.y += 1 / 16 * delta;
    });
    containerEarth.add(earthMesh);

    var mesh = THREEx.Planets.createEarthCloud();
    containerEarth.add(mesh);
    Earth3D.updateFcts.push(function(delta, now) {
        mesh.rotation.y += 1 / 8 * delta;
    });
    var boundingBox = new THREE.Box3().setFromObject(containerEarth);
    var earthRadius = boundingBox.getSize().x / 2;
    Earth3D.earth = containerEarth;


    //////////////////////////////////////////////////////////////////////////////////
    //		Mouse Controls							//
    //////////////////////////////////////////////////////////////////////////////////
    /**/
    var mouse = {
        x: 0,
        y: 0
    }
    document.addEventListener('mousemove', function(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }, false)

    Earth3D.updateFcts.push(function(delta, now) {
        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        /*
        var intersects = raycaster .intersectObject(plane);
        if (intersects.length === 1) {
            containerEarth.position.set(intersects[0].point);
        }
        */
        var ray = raycaster.ray;
        if (ray.intersectsPlane(plane)) {
            var p = new THREE.Vector3();
            ray.intersectPlane(plane, p);
            /* move
            containerEarth.position.x = p.x;
            containerEarth.position.y = p.y;
            containerEarth.position.z = p.z;
            */
            //resize
            var newr = Math.min(Math.max(Math.abs(p.x), 0.2), 1);
            var scaleFactor = newr / earthRadius;
            containerEarth.scale.x = scaleFactor;
            containerEarth.scale.y = scaleFactor;
            containerEarth.scale.z = scaleFactor;

        }
    })


    //////////////////////////////////////////////////////////////////////////////////
    //		render the scene						//
    //////////////////////////////////////////////////////////////////////////////////
    Earth3D.updateFcts.push(function() {
        //controls.update();
        containerEarth.visible = Earth3D.visible;
        renderer.render(scene, camera);
    });
}

Earth3D.start = function() {
    //////////////////////////////////////////////////////////////////////////////////
    //		loop runner							//
    //////////////////////////////////////////////////////////////////////////////////
    requestAnimationFrame(function animate(nowMsec) {
        // keep looping
        requestAnimationFrame(animate);
        // measure time
        Earth3D.lastTimeMsec = Earth3D.lastTimeMsec || nowMsec - 1000 / 60;
        var deltaMsec = Math.min(200, nowMsec - Earth3D.lastTimeMsec);
        Earth3D.lastTimeMsec = nowMsec;
        // call each update function
        Earth3D.updateFcts.forEach(function(updateFn) {
            updateFn(deltaMsec / 1000, nowMsec / 1000)
        });
    });

}
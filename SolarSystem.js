/**
 * @author Max Levine
 * @version 28 April 2020
 */

//load textures for space background, sun, and moons
sunTexture = new THREE.TextureLoader().load( "textures/fire.jpg" );
spaceTexture = new THREE.TextureLoader().load( "textures/space.jpg" );
moonTexture = new THREE.TextureLoader().load( "textures/moon2.jpg" );
moonMaterial = new THREE.MeshLambertMaterial( {color: 0xffffff, map: moonTexture} );
scene = new THREE.Scene();

//global vars
planets = [];
time = 0;
zoom = 200;

const zoomMax = 800;
const zoomMin = 250;
const zoomControlSpeed = 10;

//watch for arrow keys to move camera
window.addEventListener("keydown", function(event){
    if (event.which == 38 && zoom > zoomMin + zoomControlSpeed)
        zoom -= zoomControlSpeed;
    else if (event.which == 40 && zoom < zoomMax - zoomControlSpeed)
        zoom += zoomControlSpeed;
});

function main() {

    //set up camera and renderer
    var camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 0.1, 10000 );
    renderer = new THREE.WebGLRenderer({canvas: drawCanvas});
    renderer.setSize(drawCanvas.width, drawCanvas.height);
    renderer.setClearColor( 0xAAAAAA, 1.0 );

    //set up lighting
    scene.add(new THREE.AmbientLight( 0xffffff, 0.4 ));
    scene.add(new THREE.AmbientLight( 0x00008b, 0.2 ));
    var light = new THREE.PointLight( 0xffffff, 2, 0 );
    light.position.set( 0, 0, 0 );
    scene.add(light)
    scene.background = spaceTexture;

    //add sun
    var geometry = new THREE.SphereGeometry(89);
    var material = new THREE.MeshLambertMaterial( { map: sunTexture, emissive: 0xffff00, emissiveIntensity: 0.8 } );
    var sun = new THREE.Mesh( geometry, material );
    scene.add( sun );
    var geometry2 = new THREE.SphereGeometry(89);
    var material2 = new THREE.MeshLambertMaterial( { map: sunTexture, emissive: 0xffff00, emissiveIntensity: 0.8 } );
    var sun2 = new THREE.Mesh( geometry2, material2 );
    scene.add( sun2 );
    var geometry3 = new THREE.SphereGeometry(100);
    var material3 = new THREE.MeshBasicMaterial( { emissive: 0xffff00, emissiveIntensity: 0.2, color: 0xffff00, opacity: 0.1, transparent: true } );
    var halo = new THREE.Mesh( geometry3, material3 );
    scene.add( halo );

    //add planets
    addPlanet(13,.01,4.74,165,"moon2",0x964b00, false, 7); //mercury
    addPlanet(18,.74,3.5,197,"moon",0xffa500, false, 3.4); //venus
    addPlanet(19,1.43,2.98,217,"earth",0xffffff,true,0); //earth
    addPlanet(15,.02,2.41,244,"moon",0xffcccb,true,1.9); //mars
    addPlanet(42,-1,1.31,347,"gas",0xff9900,true,1.3); //jupiter
    addPlanet(39,-1,.97,413,"gas",0xFFFF99,true,2.5); //saturn
    addPlanet(29,-1,.67,504,"fire",0x0000ff,true,.8); //uranus
    addPlanet(29,-1,.54,573,"gas",0x00008b,true,1.8); //neptune
    addPlanet(11,.37,.47,619,"moon",0x808080,true,17.2); //pluto

    var animate = function () {
        requestAnimationFrame( animate );
        
        //slowly zoom out
        if (zoom < 1000)
            zoom += 0.3;
        //move camera
        camera.position.set( zoom, 0, zoom);
        camera.lookAt(0,0,0);

        //update planet positions
        time += .01;
        for (var i = 0; i < planets.length; i++) {
            //update main planet mesh
            planets[i].mesh.position.x = planets[i].rotationRadius*Math.cos(time * planets[i].speed + (i+1)*20); //where i is not used as index, is used for some randomization
            planets[i].mesh.position.z = planets[i].rotationRadius*Math.sin(time * planets[i].speed + (i+1)*20);
            planets[i].mesh.position.y = planets[i].orbitalInclination*Math.sin(time * planets[i].speed + (i+1)*20);
            rotate(planets[i].mesh, 0.001*i);

            //update planet atmosphere mesh
            planets[i].atmosphereMesh.position.x = planets[i].rotationRadius*Math.cos(time * planets[i].speed + (i+1)*20);
            planets[i].atmosphereMesh.position.z = planets[i].rotationRadius*Math.sin(time * planets[i].speed + (i+1)*20);
            planets[i].atmosphereMesh.position.y = planets[i].orbitalInclination*Math.sin(time * planets[i].speed + (i+1)*20);

            //update moon if has one
            if (planets[i].moonMesh != null) {
                const moonDistance = 4;
                planets[i].moonMesh.position.x = planets[i].mesh.position.x + (planets[i].size+planets[i].size/4+moonDistance)*Math.cos(2* time * planets[i].speed + (i+1)*20);
                planets[i].moonMesh.position.z = planets[i].mesh.position.z + (planets[i].size+planets[i].size/4+moonDistance)*Math.sin(2 *time * planets[i].speed + (i+1)*20);
                planets[i].moonMesh.position.y = planets[i].mesh.position.y + ((planets[i].size+planets[i].size/4+moonDistance)/(5+(i+1)*5))*Math.sin(2 * time * planets[i].speed + (i+1)*20);
                rotate(planets[i].moonMesh, 0.001*i);
            }
        }

        //rotate sun
        rotate(sun, 0.01);
        rotate(sun2, 0.005);

        renderer.render( scene, camera );
    };
    animate();
}

/**
 * @param size the radius of the planet (has to be scaled down first - this function doesn't do that)
 * @param atmosphere the atmosphere of the planet (has to be scaled down first - this function doesn't do that)
 * @param speed the orbital speed of the planet (has to be scaled down first - this function doesn't do that)
 * @param rotationRadius the distance from the sun (has to be scaled down first - this function doesn't do that)
 * @param texture the name of the jpg in textures/ to use as the planet's texture
 * @param color the color to shade the planet
 * @param hasMoon whether the planet has a moon
 * @param orbitalInclination the orbital inclination of the planet in degrees
 * This function creates a planet with the specified parameters and adds it to the planets table, and adds all of its meshes to the scene.
 */
function addPlanet(size, atmosphere, speed, rotationRadius, texture, color, hasMoon, orbitalInclination) {
    //set up main geometry and material for planet
    var loadedTexture = new THREE.TextureLoader().load( "textures/" + texture + ".jpg" );
    var geometry = new THREE.SphereGeometry(size);
    var material = new THREE.MeshLambertMaterial( {color: color, map: loadedTexture} );

    //set up atmosphere geometry and material
    var atmosphereMaterial = new THREE.MeshBasicMaterial( {color: color, opacity: 0.1, transparent: true } );
    var atmosphereGeometry = new THREE.SphereGeometry(size + atmosphere);
    
    //create the planet object, which includes its meshes and other data
    if (hasMoon) {
        var newPlanet = {moonMesh: new THREE.Mesh( new THREE.SphereGeometry(size/4), moonMaterial ), mesh: new THREE.Mesh( geometry, material ), atmosphereMesh: new THREE.Mesh( atmosphereGeometry, atmosphereMaterial ), speed: speed, rotationRadius: rotationRadius, size: size, orbitalInclination: orbitalInclination/360};
        randomRotate(newPlanet.moonMesh);
        scene.add( newPlanet.moonMesh );
    } else {        
    var newPlanet = {mesh: new THREE.Mesh( geometry, material ), atmosphereMesh: new THREE.Mesh( atmosphereGeometry, atmosphereMaterial ), speed: speed, rotationRadius: rotationRadius, size: size, orbitalInclination: orbitalInclination/360};
    }

    randomRotate(newPlanet.mesh);

    //put the new planet where it needs to go
    planets.push(newPlanet);
    scene.add( newPlanet.mesh );
    scene.add( newPlanet.atmosphereMesh );
}

//applies a random rotation to a mesh, for starting the planets out
function randomRotate(mesh) {
    mesh.rotation.x += Math.random();
    mesh.rotation.y += Math.random();
    mesh.rotation.z += Math.random();
}

//rotates the x and y of a mesh by a certain amount
function rotate(mesh, amount) {
    mesh.rotation.x += amount;
    mesh.rotation.y += amount;
}
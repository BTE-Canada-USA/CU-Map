/*+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 + Map.jsx                                                                    +
 +                                                                            +
 + Copyright (c) 2022-2023 Robin Ferch                                        +
 + https://robinferch.me                                                      +
 + This project is released under the MIT license.                            +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/

import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import axios from "axios";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {Box, Loader, LoadingOverlay} from "@mantine/core";
import {useClipboard, useDebouncedState} from "@mantine/hooks";
import {showNotification} from "@mantine/notifications";
import {BsCheck2} from "react-icons/bs";
import "mapbox-gl-style-switcher/styles.css";
import {MapboxStyleSwitcherControl} from "mapbox-gl-style-switcher";
import useQuery from "../hooks/useQuery";
import {centerOfMass, polygon} from "@turf/turf";
import {AiOutlineSearch} from "react-icons/ai";
import {SpotlightProvider} from "@mantine/spotlight";
import {BiMapPin} from "react-icons/bi";
import {searchInRegions, searchInOSM} from "../utils/SearchEngine";
import socketIOClient from "socket.io-client";

import {TbPlugConnectedX} from "react-icons/tb";
import generate3DLayer from "../utils/generate3DLayer";

import PlayerList from "./PlayerList";


const Map = forwardRef(({openDialog, setRegionViewData, updateMap, setUpdateMap}, ref) => {
    mapboxgl.accessToken = 'pk.eyJ1IjoibmFjaHdhaGwiLCJhIjoiY2tta3ZkdXJ2MDAwbzJ1cXN3ejM5N3NkcyJ9.t2yFHFQzb2PAHvPHF16sFw';

    const mapContainer = useRef(null);
    const [map, setMap] = useState(null);
    const [lng, setLng] = useState(-107.3701249);
    const [lat, setLat] = useState(58.115092);
    const [zoom, setZoom] = useState(2.5);
    const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);
    const clipboard = useClipboard();
    const [actions, setActions] = useState([]);
    const [players, setPlayers] = useState([]);
    const [playerMarkers, setPlayerMarkers] = useState([]);
    const [socketConnected, setSocketConnected] = useState(false);

    let hidePlayers = false;

    useEffect(() => {
        const socket = socketIOClient(import.meta.env.VITE_WS_HOST);

        socket.on("connect", data => {
            setSocketConnected(true);
        });

        socket.on("playerLocations", data => {
            let players = JSON.parse(data);
            let items = [];

            if (players && players.features && players.features.length) {
                
                for (let i = 0; i < players.features.length; i++) {
                    if (players.features[i].properties.uuid != '')
                        items.push(players.features[i]);
                }

                players.features = items;
            }           

            setPlayers(players)
        });

        socket.on('disconnect', () => {
            setSocketConnected(false);
            showNotification({
                title: 'Whoops',
                message: 'It looks like we have no connection to the server... Some features might not work.',
                icon: (<TbPlugConnectedX size={18}/>),
                color: "red",
            })
        })

    }, []);

    useEffect(() => {
        if (map) {
            if (playerMarkers.length > 0) {
                playerMarkers.forEach((m) => {
                    m.remove();
                })
                setPlayerMarkers([])
            }


            for (const feature of players.features) {
                const el = document.createElement('div');
                el.className = 'marker';
                el.id = "marker";
                el.style.backgroundImage = `url('https://mc-heads.net/avatar/${feature.properties.uuid}')`
                el.style.width = `32px`;
                el.style.height = `32px`;
                el.style.backgroundSize = '100%';
                el.style.borderRadius = "5px";

                el.setAttribute("data-text", feature.properties.username)
                let marker = new mapboxgl.Marker(el)
                    .setLngLat(feature.geometry.coordinates)
                    .addTo(map);
                playerMarkers.push(marker);
                setPlayerMarkers(playerMarkers)
            }


        }
    }, [players])

    useImperativeHandle(ref, () => ({

        goto(lat, lng) {
            changeLatLon(lat, lng);
        }

    }));

    const [showSearchLoading, setShowSearchLoading] = useState(false);

    const query = useQuery();

    const styles = [
        {
            title: "Dark",
            uri: "mapbox://styles/mapbox/dark-v9"
        },
        {
            title: "Light",
            uri: "mapbox://styles/mapbox/light-v9"
        },
        {title: "Outdoors", uri: "mapbox://styles/mapbox/outdoors-v11"},
        {title: "Satellite", uri: "mapbox://styles/mapbox/satellite-streets-v11"},
        {title: "Streets", uri: "mapbox://styles/mapbox/streets-v11"}
    ];


    useEffect(() => {
        if (map) return; // initialize map only once   

        class HidePlayerControl {
            onAdd(map) {
                this.map = map;
                this.container = document.createElement('div');
                this.container.classList.add("mapboxgl-ctrl");
                this.container.classList.add("mapboxgl-ctrl-group");
                this.playerButton = document.createElement("button");
                this.playerButton.type = "button";
                this.playerButton.classList.add("mapboxgl-ctrl-player-icon");
                this.playerButton.style.backgroundImage = 'url("background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\' class=\'feather feather-users\'%3E%3Cpath d=\'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\'/%3E%3Ccircle cx=\'9\' cy=\'7\' r=\'4\'/%3E%3Cpath d=\'M23 21v-2a4 4 0 0 0-3-3.87\'/%3E%3Cpath d=\'M16 3.13a4 4 0 0 1 0 7.75\'/%3E%3C/svg%3E");")'
                this.container.appendChild(this.playerButton)
                this.playerButton.addEventListener('click', () => {
                    if (hidePlayers) {
                        console.log(hidePlayers)
                        document.documentElement.style.setProperty('--marker-display', 1)
                        hidePlayers = false;
                    } else {
                        document.documentElement.style.setProperty('--marker-display', 0)
                        hidePlayers = true;
                    }


                })
                return this.container;
            }

            onRemove() {
                this.container.parentNode.removeChild(this.container);
                this.map = undefined;
            }
        }

        const mapInstance = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/nachwahl/cl2nl1qes00bn14ksw5y85arm',
            center: [lng, lat],
            zoom: zoom
        });
        mapInstance.addControl(new mapboxgl.NavigationControl());
        mapInstance.addControl(new MapboxStyleSwitcherControl(styles, {defaultStyle: "Dark"}));
        mapInstance.addControl(new HidePlayerControl());
        setMap(mapInstance)


        mapInstance.on('style.load', () => {
            let buildings = [];

            axios.get("/api/v1/interactiveBuildings/all").then(({data}) => {

                data.forEach((building) => {
                    let b = generate3DLayer(building.id, JSON.parse(building.origin), building.altitude, JSON.parse(building.rotate), building.fileURL, mapInstance)
                    mapInstance.addLayer(b);
                })


            })
        });


        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });


    });

    useEffect(() => {
        if (!map) return;
        if (!updateMap) return;
        updateRegions();
    }, [updateMap])

    const updateRegions = async () => {
        let regions = await axios.get("/api/v1/region/all/geojson")
        map.getSource('regions').data(regions.data);
        setUpdateMap(false);
    }

    useEffect(() => {
        if (map) {
            map.on('load', () => {
                addLayer().then(() => testQuery());
            })
        }
    }, [map])

    useEffect(() => {
        testQuery();
    }, [query]);

    const testQuery = async () => {
        if (query.get("region")) {
            let regionId = query.get("region");
            const uuidRegexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
            if (uuidRegexExp.test(regionId)) {
                axios.get(`/api/v1/region/${regionId}`)
                    .then(region => {
                        let coords = JSON.parse(region.data.data);
                        coords.push(coords[0]);
                        let poly = polygon([coords])
                        let centerMass = centerOfMass(poly);
                        changeLatLon(centerMass.geometry.coordinates[0], centerMass.geometry.coordinates[1])
                        if (query.get("details") === "true") {
                            openDialog({id: regionId, userUUID: region.data.userUUID, username: region.data.username});
                        }
                    })


            } else {
                console.error("string in region query is not a valid uuid. maybe a directory climbing attack?")
            }
        }
    }

    const addLayer = async () => {
        const layers = map.getStyle().layers;
        let firstSymbolId;
        for (const layer of layers) {
            if (layer.type === 'symbol') {
                firstSymbolId = layer.id;
                break;
            }
        }
        let regions = await axios.get("/api/v1/region/all/geojson")
        setShowLoadingOverlay(false);
        map.addSource('regions', {
            'type': 'geojson',
            'data': regions.data
        });

        map.addLayer({
            'id': 'regions-layer',
            'type': 'fill',
            'source': 'regions',
            'paint': {
                'fill-color': [
                    'match',
                    ['get', 'regionType'],
                    'normal',
                    'rgba(3,80,203,0.37)',
                    'event',
                    'rgba(225,4,4,0.37)',
                    'plot',
                    'rgba(30,203,3,0.37)',
                    /* other */ 'rgba(3,80,203,0.37)'
                ],
            }
        }, firstSymbolId);

        map.addLayer({
            'id': 'outline',
            'type': 'line',
            'source': "regions",
            'layout': {},
            'paint': {
                'line-color': [
                    'match',
                    ['get', 'regionType'],
                    'normal',
                    'rgb(0,90,229)',
                    'event',
                    'rgb(149,5,5)',
                    'plot',
                    'rgb(25,118,2)',
                    /* other */ 'rgb(0,90,229)'
                ],
                'line-width': 3
            }


        }, firstSymbolId);

        map.on('click', 'regions-layer', (e) => {
            openDialog(e.features[0].properties)
        });

        map.on('mouseenter', 'regions-layer', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'regions-layer', () => {
            map.getCanvas().style.cursor = '';
        });

        map.on('contextmenu', (e) => {
            clipboard.copy(e.lngLat.lat + ", " + e.lngLat.lng)
            showNotification({
                title: 'Copied successfully',
                message: 'The coordinates have been copied to your clipboard!',
                icon: <BsCheck2 size={18}/>,
                color: "teal"
            })
        })

    }

    const changeLatLon = (lat, lon) => {
        map.flyTo({
            center: [
                lon,
                lat
            ],
            zoom: 16,
            essential: true
        });
    }

    const [searchQuery, setSearchQuery] = useDebouncedState('', 200);

    useEffect(() => {
        handleQueryChange(searchQuery)
    }, [searchQuery]);

    const handleQueryChange = (query) => {
        if (!query) {
            setActions([])
        }

        const regexForCoords = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/
        if (regexForCoords.test(query)) {
            let coords = query.replace(" ", "").split(",");
            setActions([
                {
                    title: 'Go to coordinates',
                    description: query,
                    onTrigger: () => changeLatLon(coords[0], coords[1]),
                    icon: <BiMapPin size={18}/>,
                },
            ])
            return;
        }


        searchInRegions(query, changeLatLon).then(r => {
            let finished = r;
            searchInOSM(query, changeLatLon).then((r1) => {
                console.log("test1234")
                r1.forEach((osmResult) => {
                    finished.push(osmResult)
                })
                setActions(finished);
                setShowSearchLoading(false);
            })


        })


    }


    return (
        <SpotlightProvider shortcut={['mod + S']} actions={actions} onQueryChange={(query) => {
            if (query) {
                setShowSearchLoading(true);
                setSearchQuery(query);
            } else {
                setShowSearchLoading(false);
            }
        }}
                           searchIcon={showSearchLoading ? <Loader size={"xs"}/> : <AiOutlineSearch/>}
                           filter={(query, actions) => actions} limit={50}>
            <div style={{width: "100%", position: 'relative', flex: 1}}>
                {
                    !socketConnected &&
                    <Box sx={(theme) => ({
                        backgroundColor: theme.colors.red[8],
                        position: "fixed",
                        right: 5,
                        top: 5,
                        zIndex: 9999,
                        height: 25,
                        width: 25,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: "99px"
                    })}>
                        <TbPlugConnectedX size={15}/>
                    </Box>
                }
                <LoadingOverlay visible={showLoadingOverlay}/>
                <PlayerList players={players} map={map} />
                <div ref={mapContainer} style={{width: "100%", height: "100%"}}/>
            </div>
        </SpotlightProvider>

    );
});

export default Map

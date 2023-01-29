/*+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 + AdminGeneral.jsx                                                           +
 +                                                                            +
 + Copyright (c) 2023 Robin Ferch                                             +
 + https://robinferch.me                                                      +
 + This project is released under the MIT license.                            +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/

import React, {useEffect, useState} from 'react';
import {Button, Checkbox, Paper, Progress, Title, Badge, Group, Alert} from "@mantine/core";
import axios from "axios";
import {useKeycloak} from "@react-keycloak-fork/web";
import {IoWarningOutline} from "react-icons/all";
import {showNotification} from "@mantine/notifications";

const AdminGeneral = props => {

    const [progress, setProgress] = useState(0);
    const [osmProgress, setOsmProgress] = useState(0);
    const [allCount, setAllCount] = useState(0);
    const [allBuildingsCount, setAllBuildingsCount] = useState(0);
    const [skipOld, setSkipOld] = useState(false);
    const [skipOldOsm, setSkipOldOsm] = useState(false);

    const {keycloak} = useKeycloak();

    useEffect(() => {
        let interval;
        axios.get("/api/v1/stats/general").then(({data: statsData}) => {
            setAllCount(statsData.regionCount)
            setAllBuildingsCount(statsData.totalBuildings)
            interval = setInterval(async () => {
                const {data: progress} = await axios.get(`/api/v1/admin/calculateProgress`,
                    {headers: {authorization: "Bearer " + keycloak.token}})
                const {data: progressOsm} = await axios.get(`/api/v1/admin/osmDisplayNameProgress`,
                    {headers: {authorization: "Bearer " + keycloak.token}})

                const {data: stats} = await axios.get(`/api/v1/stats/general`)
                setAllBuildingsCount(stats.totalBuildings)
                setProgress(progress / statsData.regionCount * 100)
                setOsmProgress(progressOsm / statsData.regionCount * 100)
            }, 2000)
        })

        return () => clearInterval(interval);

    }, []);

    const start = () => {
        setProgress(0.0000000001);
        axios.get(`/api/v1/admin/recalculateBuildings${skipOld ? "?skipOld=true" : ""}`, {headers: {authorization: "Bearer " + keycloak.token}}).then(({data}) => {
            showNotification({
                title: "Ok",
                message: `Calcuated Buildings in ${data.count} Regions`
            })
        })
    }

    const startOsm = () => {
        setOsmProgress(0.0000000001);
        axios.get(`/api/v1/admin/getOsmDisplayNames${skipOld ? "?skipOld=true" : ""}`, {headers: {authorization: "Bearer " + keycloak.token}}).then(({data}) => {
            showNotification({
                title: "Ok",
                message: `Got OSM names for ${data.count} Regions`,
                color: "hreen"
            })
        })
    }

    const syncSearch = async () => {
        showNotification({
            title: 'Ok',
            message: 'Synchronisiere Search-DB',
            color: "green"
        })
        await axios.get(`/api/v1/admin/syncWithSearchDB`, {headers: {authorization: "Bearer " + keycloak.token}})
        showNotification({
            title: 'Finished',
            message: 'Sync complete',
            color: "green"
        })
    }


    return (
        <div>

            <Paper withBorder shadow={"md"} radius={"md"} p={"xl"} mt={"md"}>
                <Group>
                    <Title>Buildings</Title>
                    <Badge>Current {allBuildingsCount} Buildings</Badge>
                </Group>

                <Button mt={"xl"} loading={progress > 0} onClick={() => start()}>Anzahl der Buildings berechnen</Button>
                <Checkbox label={"New regions only (regions with count > 0 will be skipped."} mt={"md"}
                          value={skipOld} onChange={(event) => setSkipOld(event.currentTarget.checked)}/>
                {
                    progress > 0 &&
                    <Progress value={progress} label={`${Math.round(progress)}%`} animate mt={"xl"} radius="xl"
                              size="xl"/>
                }
            </Paper>

            <Paper withBorder shadow={"md"} radius={"md"} p={"xl"} mt={"md"}>
                <Group>
                    <Title>Search</Title>

                </Group>

                <Alert color={"red"} icon={<IoWarningOutline size={18}/>} mt={"sm"}>
                    All search items will be deleted and then recrated!
                </Alert>
                <Button color={"red"} mt={"md"} onClick={() => syncSearch()}>Resync Search Data</Button>
            </Paper>

            <Paper withBorder shadow={"md"} radius={"md"} p={"xl"} mt={"md"}>
                <Group>
                    <Title>OSM Display Name</Title>
                </Group>

                <Button mt={"xl"} loading={osmProgress > 0} onClick={() => startOsm()}>Get New OSM Display Names</Button>
                <Checkbox label={"New regions only (regions with display names are skipped)"} mt={"md"}
                          value={skipOldOsm} onChange={(event) => setSkipOldOsm(event.currentTarget.checked)}/>
                {
                    osmProgress > 0 &&
                    <Progress value={osmProgress} label={`${Math.round(osmProgress)}%`} animate mt={"xl"} radius="xl"
                              size="xl"/>
                }
            </Paper>


        </div>
    );
}

export default AdminGeneral

/*+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 + Admin.jsx                                                                  +
 +                                                                            +
 + Copyright (c) 2022-2023 Robin Ferch                                        +
 + https://robinferch.me                                                      +
 + This project is released under the MIT license.                            +
 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/

import React, {useCallback} from "react";
import {Container, Tabs, Title} from "@mantine/core";
import NavHeader from "../components/NavHeader";
import {HiOutlineMap} from "react-icons/hi";
import {FiUsers} from "react-icons/fi";
import {BiCog} from "react-icons/bi";
import AdminUsers from "../components/AdminUsers";
import AdminRegions from "../components/AdminRegions";
import {useKeycloak} from "@react-keycloak-fork/web";
import AdminGeneral from "../components/AdminGeneral";

const Admin = () => {
    //simple admin check
    const {keycloak} = useKeycloak();
    const login = useCallback(() => {
        keycloak?.login();
    }, [keycloak]);

    const isAdmin =
        keycloak?.tokenParsed?.realm_access.roles.includes("mapadmin");
    if (!keycloak?.authenticated) {
        return (
            <h1>
                Not logged in!{" "}
                <u onClick={() => login()}>Click here to login</u>
            </h1>
        );
    }
    if (!isAdmin) {
        return <h1>Not authorized - go back</h1>;
    }

    return (
        <div>
            <NavHeader/>
            <Container mt={"md"}>
                <Title>Administration</Title>
                <Tabs defaultValue="General" mt={"md"}>
                    <Tabs.List>
                        <Tabs.Tab value="General" icon={<BiCog size={20}/>}>General</Tabs.Tab>
                        <Tabs.Tab value="Users" icon={<FiUsers size={20}/>}>Users</Tabs.Tab>
                        <Tabs.Tab value="Regions" icon={<HiOutlineMap size={20}/>}>Regions</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="Users">
                        <AdminUsers/>
                    </Tabs.Panel>
                    <Tabs.Panel value="Regions">
                        <AdminRegions/>
                    </Tabs.Panel>
                    <Tabs.Panel value="General">
                        <AdminGeneral/>
                    </Tabs.Panel>
                </Tabs>
            </Container>
        </div>
    );
};

export default Admin;

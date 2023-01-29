import React, {useEffect} from 'react';
import axios from "axios";
import {useKeycloak} from "@react-keycloak-fork/web";
import {Table, ActionIcon, Group, Select, Pagination, Box, Text} from '@mantine/core';
import sortBy from 'lodash/sortBy';
import {DataTable} from 'mantine-datatable';
import {RegionView} from "../components/RegionView";
import {BiEdit} from 'react-icons/bi';
import {MdDelete} from 'react-icons/md';
import {useModals} from "@mantine/modals";
import {showNotification} from "@mantine/notifications";


const AdminRegions = () => {
    const {keycloak} = useKeycloak();
    const modals = useModals();
    const [regions, setRegions] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [openRegionView, setOpenRegionView] = React.useState(false);
    const [updateMap, setUpdateMap] = React.useState(false);
    const [regionViewData, setRegionViewData] = React.useState({
        "id": "",
        "username": "",
        "userUUID": ""
    });
    const [activePage, setPage] = React.useState(1);
    const [currentPageSize, setPageSize] = React.useState(25);
    const [totalPages, setTotalPages] = React.useState(12);
    const [sortBy, setSortBy] = React.useState('id');
    const [sortOrder, setSortOrder] = React.useState('asc');

    useEffect(() => {getRegions();}, []);

    const pageSwitch = (page) => {
        setPage(page);
        getRegions(page, currentPageSize, sortBy, sortOrder);
    };

    const pageSizeChange = (size) => {
        setPageSize(size);
        getRegions(activePage, size, sortBy, sortOrder);
    };

    const sortChange = (sortField) => {
        setSortBy(sortField);
        getRegions(activePage, currentPageSize, sortField, sortOrder);
    };

    const sortOrderChange = (sortOrder_) => {
        setSortOrder(sortOrder_);
        getRegions(activePage, currentPageSize, sortBy, sortOrder_);
    };

    const getRegions = async (currentPage, pageSize, sort, direction) => {
        //initialize params
        currentPage = currentPage === undefined ? activePage : currentPage;
        pageSize = pageSize === undefined ? currentPageSize : pageSize;
        sort = sort === undefined ? sortBy : sort;
        direction = direction === undefined ? sortOrder : direction;
        console.log('getRegions', {"sort": sort, "direction": direction, "page": currentPage, "pageSize": pageSize});

        const {data} = await axios.get(`api/v1/region/all`, {
            headers: {authorization: "Bearer " + keycloak.token},
            params: {page: currentPage, size: pageSize, sort: sort, direction: direction},
        });
        console.log("response", data);
        setRegions(data.data);
        setIsLoading(false);
        setTotalPages(data.totalPages);
    };

    const showDeleteConfirmation = (region) => {
        modals.openConfirmModal({
            title: 'Delete this region?',
            centered: true,
            children: (
                <Text size="sm">
                    Are you sure you want to delete this region? <b>This process is irreversible.</b>
                </Text>
            ),
            labels: {confirm: 'Delete region', cancel: "No don't delete it"},
            confirmProps: {color: 'red'},
            onConfirm: () => {
                deleteRegion(region.id);
            },
        });
    };

    const deleteRegion = async (id) => {
        await axios.delete(`/api/v1/region/${id}`, {headers: {authorization: "Bearer " + keycloak.token}});
        showNotification({
            title: 'Region deleted!',
            message: 'This region has been deleted.',
            color: "red"
        });
        setIsLoading(true);
        getRegions(activePage, currentPageSize);
    };

    const rows = regions.map((element) => (
        <tr key={element.id}>
            <td>{element.city}</td>
            <td>{element.area}</td>
            <td>{element.username}</td>
            <td >
                <Box sx={{display: "flex"}}>
                    <ActionIcon onClick={() => editRegion(element)}>
                        <BiEdit />
                    </ActionIcon>
                    <ActionIcon onClick={() => showDeleteConfirmation(element)}>
                        <MdDelete />
                    </ActionIcon>
                </Box>
            </td>
            <td>{element.createdAt} </td >
        </tr>
    ));

    const editRegion = async (regionData) => {
        setOpenRegionView(true);
        setRegionViewData(regionData);
    };

    return (
        <div>
            {
                isLoading ? <p>Loading...</p> :
                    <Group>
                        <Select value={sortBy} placeholder="Sort" onChange={sortChange} data={[
                            {value: 'id', label: 'ID'},
                            {value: 'city', label: 'City'},
                            {value: 'area', label: 'Area m^2'},
                            {value: 'username', label: 'Username'},
                            {value: 'createdAt', label: 'Created'},
                        ]} />
                        <Select value={sortOrder} onChange={sortOrderChange} data={[
                            {value: 'asc', label: 'aufsteigend'},
                            {value: 'desc', label: 'absteigend'},
                        ]} />
                        <Table>
                            <thead>
                                <tr>
                                    <th>City</th>
                                    <th>Area m^2</th>
                                    <th>Owner</th>
                                    <th>Actions</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>{rows}</tbody>
                        </Table>
                    </Group>
            }
            <RegionView data={regionViewData} setOpen={setOpenRegionView} open={openRegionView} setUpdateMap={setUpdateMap} />
            <Group>
                <Pagination page={activePage} onChange={pageSwitch} total={totalPages} />
                <Select value={currentPageSize} onChange={pageSizeChange} data={[
                    {label: '2', value: 2},
                    {label: '10', value: 10},
                    {label: '25', value: 25},
                    {label: '50', value: 50},
                    {label: '100', value: 100},
                    {label: '200', value: 200},
                    {label: '500', value: 500},
                    {label: '1000', value: 1000}
                ]} />
            </Group>
        </div>
    );
};



export default AdminRegions;
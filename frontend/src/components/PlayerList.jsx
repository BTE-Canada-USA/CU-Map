import { useState } from 'react';
import {ActionIcon, Box, Burger, Container, Collapse, createStyles, Group, Header, Paper, Title, Text, Image, Transition, Divider } from "@mantine/core";

const useStyles = createStyles((theme) => ({
    root: {
        position: 'absolute',
        left: '10px',
        top: '10px',
        zIndex: 2,
    },
    title: {
        padding: '2px',
        width: '100%',
        userSelect: 'none',
        cursor: 'pointer'
    },
    playerList: {
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'column'
    },
    player: {
        display: 'flex',
        justifyItems: 'flex-start',
        cursor: 'pointer'
    }
}));

const PlayerList = ({players, map}) => {
    const {classes} = useStyles();
    const [opened, setOpened] = useState(false);

    if (players && players.features && players.features.length) {
        return (
            <Paper p="md" radius="md" shadow="md" className={classes.root}>
                <Text onClick={() => setOpened((o) => !o)} className={classes.title}>
                    Players | {players.features.length}
                </Text>
    
                <Collapse in={opened}>
                    <Divider />
                    <Group className={classes.playerList}>
                        {
                            players.features.map((player, i) => <Player player={player} map={map} key={i} />) ?? null
                        }
                    </Group>
                </Collapse>
            </Paper>
        );
    }

    return null;
};

const Player = ({player, map}) => {
    const {classes} = useStyles();

    const onClick = () => {
        map.flyTo({
            center: player.geometry.coordinates,
            zoom: 14,
            speed: 1.25,
            minZoom: 5
        })
    }

    return (
        <div className={classes.player} onClick={onClick}>
            <Image src={"https://mc-heads.net/avatar/" + player.properties.uuid} alt="" radius={"sm"} style={{width: 32, marginRight: 10}}/>
            <Text>
                {player.properties.username}
            </Text>
        </div>
    );
};

export default PlayerList;
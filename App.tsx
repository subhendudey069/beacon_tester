'use strict';

import React, { useEffect, useState } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Platform,
  Text,
  FlatList,
  View,
  DeviceEventEmitter,
  TextInput
} from 'react-native';
import beacons from '@kojongdev/react-native-beacons-manager';

interface Beacon {
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  proximity: string;
  accuracy: number;
  distance: number;
}

const ReactNativeBeaconExample: React.FC = () => {
  const [uuidRef] = useState('fda50693-a4e2-4fb1-afcf-c6eb07647825');
  const [clientID] = useState(Math.floor(Math.random() * 1000));
  const [beaconsData, setBeaconsData] = useState<Beacon[]>([]);
  const [url, setUrl] = useState('http://192.168.43.30:80');

  useEffect(() => {
    if (Platform.OS === 'android') {
      beacons.detectIBeacons();

      const filterValue = 5000;
      const filterType = beacons.RUNNING_AVG_RSSI_FILTER;

      ((filterType != undefined) || (filterType != null)) && beacons.setRssiFilter(filterType, filterValue);

      if (uuidRef) {
        beacons
          .startRangingBeaconsInRegion('REGION1', uuidRef)
          .then(() => console.log('Beacons ranging started successfully'))
          .catch(error => console.log(`Beacons ranging not started, error: ${error}`));
      }
    } else {
      beacons.requestWhenInUseAuthorization();
      const region = {
        identifier: 'REGION1',
        uuid: uuidRef
      };
      beacons.startRangingBeaconsInRegion(region);
    }

    const beaconsDidRange = DeviceEventEmitter.addListener('beaconsDidRange', (data: { beacons: Beacon[] }) => {
      console.log('----------------------------------------------------------');
      console.log(data.beacons);
      console.log(data);
      if (data.beacons.length === 3) {
        setBeaconsData(data.beacons);

        let distances = data.beacons.map(beacon => ({
          beaconId: beacon.major,
          distance: Platform.OS === 'ios' ? beacon.accuracy : beacon.distance
        }));

        let payload = {
          id: clientID,
          distance: distances
        };

        fetch(url, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }).catch(() => {
          console.log("network error");
        });
      }
    });

    return () => {
      beaconsDidRange.remove();
    };
  }, [uuidRef, clientID, url]);

  const renderRow = ({ item }: { item: Beacon }) => {
    var beacon_distance = Platform.OS === 'ios' ? item.accuracy : item.distance;
    return (
      <View style={styles.row}>
        <Text style={styles.smallText}>UUID: {item.uuid ? item.uuid : 'NA'}</Text>
        <Text style={styles.smallText}>Major: {item.major}</Text>
        <Text style={styles.smallText}>Minor: {item.minor}</Text>
        <Text>RSSI: {item.rssi ? item.rssi : 'NA'}</Text>
        <Text>Proximity: {item.proximity ? item.proximity : 'NA'}</Text>
        <Text>Distance: {beacon_distance ? beacon_distance.toFixed(2) : 'NA'} m</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Beacon Server URL:</Text>
        <TextInput
          style={styles.textInput}
          value={url}
          onChangeText={(val) => {
            console.log('Value is ,', val);
            setUrl(val);
          }}
        />
      </View>
      <Text style={styles.headline}>All beacons in the area</Text>
      <FlatList
        data={beaconsData}
        keyExtractor={(item) => item.uuid + item.major + item.minor}
        renderItem={renderRow}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  },
  btleConnectionStatus: {
    paddingTop: 20
  },
  headline: {
    fontSize: 20,
    paddingTop: 20
  },
  row: {
    padding: 8,
    paddingBottom: 16
  },
  smallText: {
    fontSize: 11
  },
  inputContainer: {
    width: '80%',
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  }
});

export default ReactNativeBeaconExample;

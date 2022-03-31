import React from "react";
import PropTypes from "prop-types";
import {MapContainer, GeoJSON, Marker, Popup, TileLayer} from "react-leaflet";
import Input from "@material-ui/core/Input";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Slider from "@material-ui/core/Slider";
import Dropdown from "react-bootstrap/Dropdown";
import L from "leaflet";
// import Choropleth from "react-leaflet-choropleth";
import {features} from "./geojson";
import {white} from "material-ui/styles/colors";

// AFTERNOON TEAM


const MAIN_LOCATION = {
    coordinates: [38.9051606, -77.0036513],
    name: "Deanwood neighborhood, Washington DC",
    date: "Test date",
    info: "Test info"
};

/*const style = {
    fillColor: "#F28F3B",
    weight: 2,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.5
};*/

const mapPolygonColorToDensity = (density => {
    return density > 30000
        ? "#a50f15"
        : density > 25000
            ? "#de2d26"
            : density > 20000
                ? "#fb6a4a"
                : density > 15000
                    ? "#fc9272"
                    : density > 10000
                        ? "#fcbba1"
                        : "#ffdccc";
});

const style = (feature => {
    return ({
        fillColor: mapPolygonColorToDensity(feature.properties.density),
        weight: 1,
        opacity: 1,
        color: "white",
        dashArray: "2",
        fillOpacity: 0.5
    });
});

function sliderInput(value, bound, defaultRange, inputChangeFunc, sliderBlurFunc) {
    const [minValue, maxValue] = defaultRange;

    return (
        <Input
            value={value}
            margin="dense"
            onChange={e => inputChangeFunc(e, bound)}
            onBlur={() => sliderBlurFunc()}
            inputProps={{
                "step": 1,
                "min": minValue,
                "max": maxValue,
                "type": "number",
                "aria-labelledby": "input-slider"
            }}
        />
    );
}


function timeSlider(
    sliderName, currentRange, defaultRange, lastValid,
    sliderChangeFunc, inputChangeFunc, sliderBlurFunc
) {
    const [minValue, maxValue] = defaultRange;
    return (
        <div key={sliderName}>
            <Typography id="range-slider" gutterBottom>
                {sliderName}
            </Typography>
            <Grid container spacing={2} alignItems="center">
                <Grid item>
                    {sliderInput(
                        currentRange[0],
                        "lower",
                        defaultRange,
                        inputChangeFunc,
                        sliderBlurFunc
                    )}
                </Grid>
                <Grid item xs>
                    <Slider
                        value={typeof lastValid === "object" ? lastValid : defaultRange}
                        onChange={(e, v) => sliderChangeFunc(e, v)}
                        min={minValue}
                        max={maxValue}
                        valueLabelDisplay="auto"
                        aria-labelledby="range-slider"
                    />
                </Grid>
                <Grid item>
                    {sliderInput(
                        currentRange[1],
                        "upper",
                        defaultRange,
                        inputChangeFunc,
                        sliderBlurFunc
                    )}
                </Grid>
            </Grid>
        </div>
    );
}


// Dropdown options
// On select event change state
function renderFilter(dataChangeFunc) {
    return (
        <select onChange={dataChangeFunc}>
            <option disabled={true}>Filter</option>
            <option value="addresses">Addresses</option>
            <option value="church">Church</option>
            <option value="school">School</option>
            <option value="population">Population density</option>
        </select>
    );
}

function renderLegend() {
    return (
        <div>
            <h5>Legend</h5>
            <ul>
                <li><span style={{background: "#a50f15", padding: "0 5px", margin: "0 4px 0 0"}}/> -
                    From 30,000
                </li>
                <li><span style={{background: "#de2d26", padding: "0 5px", margin: "0 4px 0 0"}}/> -
                    From 25,000
                </li>
                <li><span style={{background: "#fb6a4a", padding: "0 5px", margin: "0 4px 0 0"}}/> -
                    From 20,000
                </li>
                <li><span style={{background: "#fc9272", padding: "0 5px", margin: "0 4px 0 0"}}/> -
                    From 10,000
                </li>
                <li><span style={{background: "#fcbba1", padding: "0 5px", margin: "0 4px 0 0"}}/> -
                    Less than 10,000
                </li>
            </ul>
        </div>
    );
}


export class TimeControl extends React.Component {
    // Modify these to change the step of each increment
    static OFF = 0;
    static Reverse = -10;
    static Forward = 10;

    constructor(props) {
        // Props given to TimeControl from its parent (MapMicro):
        //      change: Function that changes MapMicro's sliderState which causes the slider to move
        //      sliderState: The current slider's values
        //      defaultTime: The default min and max possible range of of the slider
        super(props);
        // There are only 3 possible active states for TimeControl: OFF, Reverse, and Forward
        this.state = {
            active: TimeControl.OFF
        };
    }

    componentDidMount() {
        // Modify timeout to change how often increment is called
        this.time = setInterval(this.increment, 1000);
    };

    componentWillUnmount() {
        clearInterval(this.time);
    };

    increment = () => {
        const [currentLow, currentHigh] = this.props.sliderState;
        const [minLow, maxHigh] = this.props.defaultTime;
        // Code here must prevent crossing
        switch (this.state.active) {
        case TimeControl.OFF:
            break;

        case TimeControl.Forward:
            let newLowest = currentLow + TimeControl.Forward;
            if (newLowest > currentHigh) {
                newLowest = minLow;
            }
            this.props.change(newLowest, currentHigh);
            break;

        case TimeControl.Reverse:
            let newHighest = currentHigh + TimeControl.Reverse;
            if (newHighest < currentLow) {
                newHighest = maxHigh;
            }
            this.props.change(currentLow, newHighest);
            break;

        default:
            throw new Error("Should not get up to this point");

        }
    }
    changeState = (change) => {
        switch (change) {
        case TimeControl.Reverse:
            return () => this.setState({active: TimeControl.Reverse});

        case TimeControl.Forward:
            return () => this.setState({active: TimeControl.Forward});

        case TimeControl.OFF:
            return () => this.setState({active: TimeControl.OFF});

        default:
            throw new Error("Should not get to this point");
        }

    }

    render() {
        return (
            <div className="timeControl">
                <button onClick={this.changeState(TimeControl.Reverse)}>Reverse</button>
                <button onClick={this.changeState(TimeControl.OFF)}>Stop</button>
                <button onClick={this.changeState(TimeControl.Forward)}>Forward</button>
            </div>
        );
    }
}

TimeControl.propTypes = {
    change: PropTypes.func,
    sliderState: PropTypes.array,
    defaultTime: PropTypes.array
};

const blueIcon = new L.Icon({
    iconUrl:
        "https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|abcdef&chf=a,s,ee00FFFF",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export class MapDropdown extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
            selected: []
        };
    }

    toggleItemSelect = (event) => {
        // Implementation does not allow selecting items with the same name individually

        const value = event.target.innerText;
        const newSelected = this.state.selected;
        if (this.state.selected.includes(value)) {
            const valueIdx = newSelected.indexOf(value);
            newSelected.splice(valueIdx, 1);
            event.target.classList.remove("map-dropdown-item-selected");
            event.target.classList.add("map-dropdown-item");
        } else {
            newSelected.push(value);
            event.target.classList.remove("map-dropdown-item");
            event.target.classList.add("map-dropdown-item-selected");
        }
        this.setState({selected: newSelected});
        console.log(this.state.selected);
    }

    toggleDropdownItems = () => {
        this.setState({open: !this.state.open});
    }

    getDropdownItems() {
        if (!this.state.open) {
            return <></>;
        }
        const selected = "map-dropdown-item-selected";
        const normal = "map-dropdown-item";
        const dropdownItems = (
            this.props.items.map((location, i) => (
                <div
                    key={i}
                    className={
                        this.state.selected.includes(location.address) ? selected : normal
                    }
                    onClick={this.toggleItemSelect}
                >
                    {location.address}
                </div>
            ))
        );
        return (
            <div className="map-dropdown-scroll-bg">
                <div className="map-dropdown-scroll">
                    {dropdownItems}
                </div>
            </div>
        );
    }

    render() {
        const dropdownItems = this.getDropdownItems();
        return (
            <div className="map-dropdown">
                <Dropdown.Toggle
                    id="dropdown-autoclose-outside"
                    className="map-dropdown-toggle"
                    onClick={this.toggleDropdownItems}
                >
                    {this.props.name}
                </Dropdown.Toggle>
                {dropdownItems}
            </div>
        );
    }
}

MapDropdown.propTypes = {
    name: PropTypes.string,
    items: PropTypes.array
};

export default class MapMicro extends React.Component {
    //  Create the Icon
    constructor(props) {
        super(props);

        this.state = {
            mainLocation: MAIN_LOCATION,
            markerData: [],
            geojson: {},
            isPopulation: false,
            mapInfo: "population",
            sliderState: [1900, 2022],
            timeRange: [1900, 2022],
            lastValid: [1900, 2022],
            names: ["Australia", "Canada", "USA", "Poland", "Spain", "France"]
        };
    }

    componentDidMount() {
        this.getAddress();
        this.getPopulation();
    };

    getAddress() {
        fetch("/api/get_address_data/")
            .then(response => {
                return response.json();
            })
            .then(data => {
                this.setState({
                    markerData: [...this.state.markerData, ...data["address_data"]],
                    isPopulation: false
                });
            });
    }

    getPopulation() {
        // fetch(
        //     "https://raw.githack.com/datafaust/raw/main/cruise-prototype/hh_2020112300_2020120623_Saturday_02.geojson"
        // )
        //     .then((response) => response.json())
        //     .then((geojson) => {
        //         console.log("Getting GeoJson data");
        //         console.log(geojson);
        //         this.setState({geojson, loaded: 2});
        //     });
        const _features = features.map((feature) => {
            feature.properties.density = Math.floor(Math.random() * 40000);
            return feature;
        });

        console.log("Features", _features);

        this.setState({
            geojson: _features
        });
    }

    setSliderValue = (newLowerBound, newUpperBound) => {
        this.setState({
            sliderState: [newLowerBound, newUpperBound],
            lastValid: [newLowerBound, newUpperBound]
        });
    }

    handleSliderChange = (event, value) => {
        const [newLowerBound, newUpperBound] = value;
        this.setSliderValue(newLowerBound, newUpperBound);
    }

    handleChangeData = (event) => {
        switch (event.target.value) {
        case "addresses":
            this.setState({
                isPopulation: false
            });
            this.getAddress();
            break;
        case "church":
            const churchAddr = {
                address: "Church Address",
                year: 2000,
                coordinates: ["38.9074322", "-77.0350922"],
                icon: greenIcon
            };
            this.setState({
                markerData: [churchAddr],
                isPopulation: false
            });
            break;
        case "school":
            const schoolAddr = {
                address: "Church Address",
                year: 2000,
                coordinates: ["38.8856607", "-77.03272853070882"],
                icon: blueIcon
            };
            this.setState({
                markerData: [schoolAddr],
                isPopulation: false
            });
            break;
        case "population":
            this.setState({
                isPopulation: true
            });

            this.getPopulation();
            break;
        default:
            this.getAddress();
        }
    }

    handleSliderInputChange = (event, bound) => {
        const [currentLowerValue, currentUpperValue] = this.state.sliderState;
        const [minValue, maxValue] = this.state.timeRange;
        let newSliderState = this.state.sliderState;
        let newValidState = [...this.state.lastValid];
        const isLower = (bound === "lower");
        const isUpper = (bound === "upper");

        if (event.target.value === "") {
            this.setState({
                sliderState: [isLower ? "" : currentLowerValue, isUpper ? "" : currentUpperValue],
                lastValid: newValidState
            });
            return;
        }

        const newValue = Number(event.target.value);
        // Only valid bound inputs will affect the slider by changing the newValidState
        if (isLower) {
            if (newValue <= currentUpperValue && newValue >= minValue) {
                newValidState = [newValue, currentUpperValue];
            }
            newSliderState = [newValue, currentUpperValue];

        } else if (isUpper) {
            if (newValue >= currentLowerValue && newValue <= maxValue) {
                newValidState = [currentLowerValue, newValue];
            }
            newSliderState = [currentLowerValue, newValue];
        }

        this.setState({
            sliderState: newSliderState,
            lastValid: newValidState
        });
    };

    handleSliderBlur = () => {
        // Used when slider changed by dragging after changing inputs
        // Needed if inputs are not bounded by the slider" maximum and minimum values
        const [currentLowerValue, currentUpperValue] = this.state.sliderState;
        const [minValue, maxValue] = this.state.timeRange;
        const [lastLowerValid, lastUpperValid] = this.state.lastValid;
        if (currentLowerValue < minValue || currentLowerValue > lastUpperValid) {
            this.setSliderValue(lastLowerValid, currentUpperValue);
        } else if (currentUpperValue > maxValue || currentUpperValue < lastLowerValid) {
            this.setSliderValue(currentLowerValue, lastUpperValid);
        }
    };

    render() {
        const validAddresses = this.state.markerData.filter((location) => (
            (location.coordinates.length === 2 && location.year &&
                location.year >= this.state.lastValid[0] &&
                location.year <= this.state.lastValid[1]) ||
            (!location.year)
        ));


        const markerObjects = validAddresses.map((location, i) => (
            <Marker key={i} position={location.coordinates}
                icon={location.icon ? location.icon : blueIcon}>
                <Popup>
                    {location.address}
                </Popup>
            </Marker>
        ));

        const cholo = this.state.geojson && (
            <GeoJSON data={this.state.geojson} style={style}/>
        );

        return (<>
            <h1>{this.state.mainLocation.name}</h1>
            <div className="main-element">
                <div className="event-selector">
                    <h3 className="event-selector-title">Event Selector</h3>
                    <MapDropdown name="Addresses" items={this.state.markerData}/>
                </div>
                <div id="map">
                    <MapContainer
                        center={this.state.mainLocation.coordinates} zoom={13}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                            url="http://stamen-tiles-a.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png"
                        />

                        {this.state.isPopulation ? cholo : markerObjects}

                        {this.state.isPopulation && (
                            <div style={{
                                marginTop: "17.5rem", marginLeft: "150px",
                                position: "absolute", zIndex: 1000,
                                background: white,
                                padding: "8px",
                                bottom: "8px"
                            }}>
                                {renderLegend()}
                            </div>
                        )}


                        <div style={{
                            marginTop: "17.5rem", marginLeft: "0.75rem",
                            position: "absolute", zIndex: 1000
                        }}>
                            {renderFilter(this.handleChangeData)}
                        </div>


                    </MapContainer>

                    {timeSlider(
                        "Time Slider",
                        this.state.sliderState,
                        this.state.timeRange,
                        this.state.lastValid,
                        this.handleSliderChange,
                        this.handleSliderInputChange,
                        this.handleSliderBlur
                    )}
                    <TimeControl
                        sliderState={this.state.sliderState} change={this.setSliderValue}
                        defaultTime={this.state.timeRange}>
                    </TimeControl>
                </div>
            </div>
        </>);
    }
}

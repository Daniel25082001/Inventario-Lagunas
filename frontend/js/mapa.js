// ===============================
// Crear el mapa
// ===============================

const mapa = L.map("map", { zoomControl: false }).setView([-34.8754,-60.4774], 7);

// ===============================
// Capas Base
// ===============================

const satelite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution: "Esri"
    }
);

const ign = L.tileLayer(
    "https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG%3A3857@png/{z}/{x}/{-y}.png",
    {
        maxZoom: 20,
        minZoom: 1,
        attribution: "Instituto Geográfico Nacional"
    }
);

ign.addTo(mapa);

L.control.scale({ position: "bottomleft" }).addTo(mapa);

const mapasBase = {
    "Google Satélite": satelite,
    "Argenmap": ign
};

L.control.layers(mapasBase, null, { position: "topright" }).addTo(mapa);
L.control.zoom({ position: "topright" }).addTo(mapa);

const capas = [
    {
        id: "Córdoba",
        nombre: "Pcia. de Córdoba",
        archivo: "data/Cordoba.geojson",
        color: "#6b5238",
        estilo: {
            color: "#6b5238",
            weight: 2,
            fillOpacity: 0
        }
    },
    {
        id: "buenosAires",
        nombre: "Pcia. de Buenos Aires",
        archivo: "data/buenos aires.geojson",
        color: "#63966e",
        estilo: {
            color: "#63966e",
            weight: 2,
            fillOpacity: 0
        }
    },
    {
        id: "santaFe",
        nombre: "Pcia. de Santa Fe",
        archivo: "data/santa fe.geojson",
        color: "#c46b3c",
        estilo: {
            color: "#c46b3c",
            weight: 2,
            fillOpacity: 0
        }
    },

     {
        id: "lagunas-cordoba",
        nombre: "Lagunas de Córdoba",
        archivo: "data/lagunas-cordoba.geojson",
        color: "#6b5238",
        estilo: {
            color: "#6b5238",
            weight: 1,
            fillColor: "#6b5238 ",
            fillOpacity: 0.7
        }
    },

     {
        id: "lagunas-buenosaires",
        nombre: "Lagunas de Buenos Aires",
        archivo: "data/lagunas-buenosaires.geojson",
        color: "#63966e",
        estilo: {
            color: "#63966e",
            weight: 1,
            fillColor: "#63966e ",
            fillOpacity: 0.7
        }
    },
    {
        id: "lagunas-santafe",
        nombre: "Lagunas de Santa Fe",
        archivo: "data/lagunas-santafe.geojson",
        color: "#c46b3c",
        estilo: {
            color: "#c46b3c",
            weight: 1,
            fillColor: "#c46b3c ",
            fillOpacity: 0.7
        }
    }

    
];

const capasCargadas = {};
const listadoCapas = document.getElementById("layer-list");

const popupClassByCapa = {
    "Córdoba": "popup-cordoba",
    "buenosAires": "popup-buenosaires",
    "santaFe": "popup-santafe",
    "lagunas-cordoba": "popup-lagunas-cordoba",
    "lagunas-buenosaires": "popup-lagunas-buenosaires",
    "lagunas-santafe": "popup-lagunas-santafe"
};

function getPopupOptions(capaId) {
    const popupClass = popupClassByCapa[capaId];
    return popupClass ? { className: popupClass } : {};
}

function ajustarVista(capaPrioritaria = null) {
    if (capaPrioritaria) {
        mapa.fitBounds(capaPrioritaria.getBounds(), { padding: [20, 20] });
        return;
    }

    const boundsVisibles = Object.values(capasCargadas)
        .filter(capa => mapa.hasLayer(capa.layer))
        .map(capa => capa.layer.getBounds())
        .filter(bounds => bounds && bounds.isValid && bounds.getSouthWest());

    if (boundsVisibles.length > 0) {
        const bounds = L.latLngBounds(boundsVisibles);
        mapa.fitBounds(bounds, { padding: [20, 20] });
    }
}

function crearPanelCapas() {
    capas.forEach((capa) => {
        const item = document.createElement("label");
        item.className = "layer-item";

        item.innerHTML = `
            <span class="layer-label">
                <span class="swatch" style="background:${capa.color};"></span>
                <span>${capa.nombre}</span>
            </span>
            <input type="checkbox">
        `;

        const checkbox = item.querySelector("input");

        checkbox.addEventListener("change", () => {
            const info = capasCargadas[capa.id];

            if (!info) {
                return;
            }

            if (checkbox.checked) {
                info.layer.addTo(mapa);
            } else {
                mapa.removeLayer(info.layer);
            }

            ajustarVista();
        });

        listadoCapas.appendChild(item);
    });
}

function cargarCapa(capa) {
    fetch(capa.archivo)
        .then(response => response.json())
        .then(data => {
            const datosCapa = capa.id === "santaFe"
                ? {
                    ...data,
                    features: data.features.filter(feature =>
                        String(feature.properties?.in1 || "").startsWith("82")
                    )
                }
                : data;

            const layer = L.geoJSON(datosCapa, {
                style: capa.estilo,
                onEachFeature: function (feature, layerItem) {
                    if (feature.properties) {
                        const codigo = feature.properties.field_2 || "Sin código";
                        const popupOptions = getPopupOptions(capa.id);

                        layerItem.bindPopup(`
                            <div class="popup-content">
                                <strong>${capa.nombre}</strong><br>
                                <b>Código:</b> ${codigo}
                            </div>
                        `, popupOptions);
                    }
                }
            });

            capasCargadas[capa.id] = {
                ...capa,
                layer
            };
        })
        .catch(error => console.error(`Error cargando ${capa.nombre}:`, error));
}

crearPanelCapas();
capas.forEach(cargarCapa);
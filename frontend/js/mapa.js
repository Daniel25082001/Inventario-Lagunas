// ===============================
// Crear el mapa
// ===============================

const mapa = L.map("map", { zoomControl: false }).setView([-34.8754,-60.4774], 7);

// ===============================
// Capas Base
// ===============================

const osm = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap"
    }
);

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
    "OpenStreetMap": osm,
    "Satélite": satelite,
    "IGN Argentina": ign
};

L.control.layers(mapasBase, null, { position: "topright" }).addTo(mapa);
L.control.zoom({ position: "topright" }).addTo(mapa);

const capas = [
    {
        id: "Córdoba",
        nombre: "Córdoba",
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
        nombre: "Buenos Aires",
        archivo: "data/buenos aires.geojson",
        color: "#e0c06b",
        estilo: {
            color: "#e0c06b",
            weight: 2,
            fillOpacity: 0
        }
    },
    {
        id: "santaFe",
        nombre: "Santa Fe",
        archivo: "data/santa fe.geojson",
        color: "#c46b3c",
        estilo: {
            color: "#c46b3c",
            weight: 2,
            fillOpacity: 0
        }
    },
    {
        id: "lagunas",
        nombre: "Lagunas",
        archivo: "data/lagunas.geojson",
        color: "#4fe3f7",
        estilo: {
            color: "#4fe3f7",
            weight: 1,
            fillColor: "#4fe3f7",
            fillOpacity: 0.7
        }
    }
];

const capasCargadas = {};
const listadoCapas = document.getElementById("layer-list");

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

                        layerItem.bindPopup(`
                            <strong>${capa.nombre}</strong><br>
                            <b>Código:</b> ${codigo}
                        `);
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
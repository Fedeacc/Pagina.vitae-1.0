window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    
    // Le damos un pequeño delay extra para que no sea un "flash" muy rápido
    setTimeout(() => {
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
    }, 1000); // 1 segundo de gracia
});

/* ===== ELEMENTOS GENERALES ===== */
const COSTO_DISENIO = 1000;
const PRECIOS_IMAN = {
    "Polaroid Común": 400,      
    "Polaroid Extralarge": 600,
    "Polaroid Cuadrada": 600,
    "Polaroid strips": 500,
};
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const searchBtn = document.getElementById("searchIcon");
const searchBar = document.getElementById("searchBar");
const topBar = document.querySelector(".top-bar");
let currentImages = [];
let currentIndex = 0;
let tieneImantacion = false;
let disenioTemporal = "Sin diseño"; // Guardará el diseño mientras el usuario elige
// Función de ingeniería para convertir archivo a Base64
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        // Quitamos el prefijo "data:image/webp;base64,"
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
    };
    reader.onerror = error => reject(error);
});

/* ===== MENÚ & BUSCADOR ===== */
if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
        mobileMenu.style.display = (mobileMenu.style.display === "flex") ? "none" : "flex";
        if (searchBar) searchBar.style.display = "none";
    });
}

if (searchBtn && searchBar) {
    searchBtn.addEventListener("click", () => {
        searchBar.style.display = (searchBar.style.display === "block") ? "none" : "block";
        if (mobileMenu) mobileMenu.style.display = "none";
    });
}

/* ===== CERRAR AL TOCAR FUERA ===== */
window.addEventListener("click", (e) => {
    // Para el buscador
    if (searchBar && searchBtn) {
        if (!searchBar.contains(e.target) && !searchIcon.contains(e.target)) {
            searchBar.style.display = "none";
            const suggestions = document.getElementById("searchSuggestions");
            if (suggestions) suggestions.style.display = "none";
        }
    }

    // Para el menú mobile
    if (mobileMenu && menuBtn) {
        if (!mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
            mobileMenu.style.display = "none";
        }
    }
});

/* ===== VISOR DE PRODUCTO ===== */
const products = document.querySelectorAll(".view-product");
const productView = document.getElementById("productView");
const viewImage = document.getElementById("viewImage");
const viewTitle = document.getElementById("viewTitle");
const viewPrice = document.getElementById("viewPrice");
const viewDescription = document.getElementById("viewDescription");
const closeView = document.getElementById("closeView");
const selectedBorderText = document.getElementById("selectedBorderText");
const btnDoneDesign = document.getElementById("btnDoneDesign");

/* ===== VISOR DE PRODUCTO (VERSIÓN FINAL CORREGIDA) ===== */
products.forEach(button => {
    button.addEventListener("click", () => {
        resetDesign(); // Llamamos a la función de reseteo
        const card = button.closest(".product-card");
        if (!card) return;

        const simulationContainer = document.getElementById("simulationContainer");
        const borderContainer = document.getElementById("border-designs-container");
        const toggleBtn = document.getElementById("toggleViewMode"); // El botón azul
        const borderOptions = document.getElementById("border-options");
        const borderLayer = document.getElementById("borderLayer");
        const nombreProducto = card.dataset.name || "";

        // ---CAPTURA DE IMÁGENES ---
        const galleryData = card.dataset.gallery; 
        const mainImage = card.dataset.image;

        if (galleryData && galleryData.trim() !== "") {
            currentImages = galleryData.split(",");
        } else {
            currentImages = [mainImage]; // Si no hay galería, el array solo tiene la foto principal
        }

        currentIndex = 0; // Resetear siempre al inicio

        // 1. Llamadas a funciones externas
        if (typeof actualizarVisibilidadImantacion === "function") actualizarVisibilidadImantacion(nombreProducto);
        if (typeof ajustarMoldeSegunProducto === "function") ajustarMoldeSegunProducto(nombreProducto);

        // 2. Reseteo de estado
        if (simulationContainer) simulationContainer.style.display = "none";
        if (borderContainer) borderContainer.style.display = "none";
        viewImage.style.display = "block";
        if (selectedBorderText) selectedBorderText.style.display = "none";
        document.querySelectorAll(".layout-btn").forEach(btn => btn.classList.remove("selected"));
        const borderDisplay = document.getElementById("borderNameDisplay");
        if (borderDisplay) borderDisplay.textContent = "Sin diseño";

        // 3. Carga de datos
        viewImage.src = card.dataset.image || "";
        viewTitle.textContent = card.dataset.name || "";
        viewPrice.textContent = card.dataset.price || "";
        viewDescription.innerHTML = card.dataset.description || "";

        actualizarSlider();
        // 4. LÓGICA CRÍTICA DE BORDES (Aquí está la magia)
        const bordersData = card.dataset.borders; // Obtenemos el atributo

        // Verificamos si existe el atributo y si tiene contenido real (no está vacío o solo espacios)
        const tieneBordesConfigurados = bordersData && bordersData.trim() !== "";

        if (toggleBtn) {
            if (tieneBordesConfigurados) {
                // SI TIENE BORDES: Mostramos el botón azul
                toggleBtn.style.display = "inline-block";
                toggleBtn.textContent = `✨ Personalizar diseño (+$${COSTO_DISENIO.toLocaleString('es-AR')})`;
            } else {
                // NO TIENE BORDES: Ocultamos el botón azul COMPLETAMENTE
                toggleBtn.style.display = "none";
            }
        }

        if (borderOptions) borderOptions.innerHTML = "";
        if (borderLayer) {
            borderLayer.style.backgroundImage = "none";
            borderLayer.style.backgroundColor = "transparent";
        }

        // Solo procesamos los thumbnails si hay bordes
        if (tieneBordesConfigurados && borderOptions) {
            bordersData.split(",").forEach((item, index) => {
                const parts = item.split(":");
                if (parts.length < 3) return;
                const [nombre, urlMini, urlReal] = parts;

                const wrapper = document.createElement("div");
                wrapper.className = "thumb-wrapper";
                wrapper.style.cssText = "text-align: center; width: 75px; display: inline-block; vertical-align: top; margin: 5px;";

                const btnBorder = document.createElement("div");
                btnBorder.className = "border-thumb"; 
                btnBorder.style.backgroundImage = `url('${urlMini.trim()}')`;
                
                btnBorder.onclick = () => {
                    if (borderLayer) borderLayer.style.backgroundImage = `url('${urlReal.trim()}')`;
                    document.querySelectorAll(".border-thumb").forEach(b => b.classList.remove("selected"));
                    btnBorder.classList.add("selected");
                    disenioTemporal = nombre.trim();
                    recalcularPrecioTotal();
                };

                wrapper.appendChild(btnBorder);
                borderOptions.appendChild(wrapper);
                if (index === 0) btnBorder.click();
            });
        }

        // 5. Variantes (Packs)
        const variantsData = card.dataset.variants;
        const variantSelect = document.getElementById("variantSelect");
        const variantContainer = document.getElementById("variant-container");

        if (variantsData && variantSelect) {
            variantContainer.style.display = "block";
            variantSelect.innerHTML = ""; 
            variantsData.split(",").forEach(optText => {
                const partsV = optText.trim().split(":");
                if(partsV.length < 3) return;
                const [vNombre, vPrecio, vImg] = partsV;
              const opt = document.createElement("option");
                opt.value = vPrecio;
                opt.textContent = vNombre;
                opt.dataset.img = vImg;
                variantSelect.appendChild(opt);
            });
            variantSelect.onchange = () => {
                const sel = variantSelect.options[variantSelect.selectedIndex];
                viewPrice.textContent = `$${parseInt(sel.value).toLocaleString('es-AR')}`;
                viewImage.src = sel.dataset.img;
                recalcularPrecioTotal();
            };
        } else if (variantContainer) {
            variantContainer.style.display = "none";
        }

        // 6. Layouts (Tiras/Strips)
        const layoutData = card.dataset.layout;
        const layoutContainer = document.getElementById("layout-container");
        const layoutOptions = document.getElementById("layout-options");

        if (layoutContainer && layoutOptions) {
            if (!layoutData || layoutData.trim() === "") {
                layoutContainer.style.display = "none";
            } else {
                layoutContainer.style.display = "block";
                layoutOptions.innerHTML = ""; 
                
                layoutData.split(",").forEach((opt, index) => {
                    const btnLayout = document.createElement("button");
                    btnLayout.textContent = opt.trim();
                    btnLayout.className = "layout-btn";
                    
                    btnLayout.onclick = () => {
                        document.querySelectorAll(".layout-btn").forEach(b => b.classList.remove("selected"));
                        btnLayout.classList.add("selected");
                        
                        const fEspacio = document.getElementById("photoSpace");
                        const lChin = document.getElementById("polaroidChin");
                        const molde = document.getElementById("polaroidPreview");

                        if (fEspacio && lChin) {
                            fEspacio.innerHTML = ""; 
                            fEspacio.classList.add("grid-strips");
                            fEspacio.style.aspectRatio = "auto"; 
                            fEspacio.style.backgroundColor = "transparent";
                            fEspacio.style.backgroundImage = "none";
                            fEspacio.style.setProperty('background-color', 'transparent', 'important');

                            if (molde) {
                                molde.style.height = "auto"; 
                                molde.style.paddingBottom = "20px";
                            }

                            const cantidad = opt.includes("3") ? 3 : 4;

                            if (cantidad === 3) {
                                lChin.style.height = "50px"; 
                                fEspacio.style.gap = "15px"; 
                            } else {
                                lChin.style.height = "0px"; 
                                fEspacio.style.gap = "10px"; 
                            }

                            for (let i = 0; i < cantidad; i++) {
                                const slot = document.createElement("div");
                                slot.className = "mini-photo-slot";
                                // Si son 3 fotos, las hacemos más altas (verticales)
                                if (cantidad === 3) {
                                 slot.style.aspectRatio = "1 / 1.25"; // Probá con 1.3 si las querés más largas aún
                                } else {
                                    slot.style.aspectRatio = "1 / 1"; // Las de 4 quedan cuadradas para que entren bien
                                }
                                slot.innerHTML = '<span style="font-size:8px; color:#ccc; opacity:0.5;">FOTO</span>'; 
                                fEspacio.appendChild(slot);
                            }
                        }
                    };
                    
                    layoutOptions.appendChild(btnLayout);
                    if (index === 0) setTimeout(() => btnLayout.click(), 100);
                });
            }
        }

        // 7. Abrir Visor
        if (productView) productView.style.display = "flex";
    });
});


if (closeView) {
    closeView.addEventListener("click", () => {
        productView.style.display = "none";
    });
}

/* ===== LÓGICA DEL CARRITO ===== */
let cart = [];
let montoSeleccionado = 0;
let tipoDePago = "";

const cartIcon = document.getElementById("cartIcon");
const cartView = document.getElementById("cartView");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartSenia = document.getElementById("cartSenia");
const addToCartBtn = document.getElementById("addToCart");


function updateCart() {
    const itemsContainer = document.getElementById("cartItems");
    const totalSpan = document.getElementById("cartTotal");
    const seniaSpan = document.getElementById("cartSenia");

    if (!itemsContainer || !totalSpan || !seniaSpan) {
        console.error("Error: No se encontraron los contenedores del carrito en el HTML.");
        return;
    }

    itemsContainer.innerHTML = "";
    let total = 0;

    cart.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "cart-item-row";
        
        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 0; border-bottom: 1px solid #eee;">
                <img src="${item.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 5px;">
                <div style="flex-grow: 1;">
                    <span style="display: block; font-weight: 500; font-size: 0.9rem;">${item.name}</span>
                    <span style="font-weight: bold; color: #112a4a;">$${item.price.toLocaleString('es-AR')}</span>
                </div>
                <button onclick="eliminarProducto(${index})" style="background: none; border: none; color: #112a4a; cursor: pointer; font-size: 1.5rem;">×</button>
            </div>
        `;
        
        itemsContainer.appendChild(div);
        total += item.price;
    });

    const senia = total / 2;
    totalSpan.textContent = total.toLocaleString('es-AR');
    seniaSpan.textContent = senia.toLocaleString('es-AR');

    if (typeof updateCartCounter === "function") {
        updateCartCounter();
    }
}

/* ===== EVENTOS DE APERTURA Y CIERRE (FUERA DE LA FUNCIÓN) ===== */

if (cartIcon && cartView) {
    cartIcon.onclick = function(e) {
        e.preventDefault(); 
        cartView.style.display = "flex"; 
        document.body.style.overflow = "hidden"; // CONGELA EL FONDO
        updateCart(); 
    };
}

if (closeCart) {
    closeCart.onclick = function() {
        cartView.style.display = "none"; 
        document.body.style.overflow = "auto"; // LIBERA EL FONDO
        if (document.getElementById("transfer-step")) {
            cancelarPago(); 
        }
    };
}

/* ===== FLUJO DE PAGO Y TRANSFERENCIA ===== */
function copiarTexto(idElemento, tipo) {
    const texto = document.getElementById(idElemento).textContent;
    navigator.clipboard.writeText(texto).then(() => {
        showToast(`¡${tipo} copiado! 📋`);
    }).catch(err => {
        console.error('Error al copiar: ', err);
    });
}

function prepararTransferencia(tipo) {
    // Referencias a elementos
    const inputName = document.getElementById("cust-name");
    const inputWsp = document.getElementById("cust-wsp");
    const errorName = document.getElementById("error-name");
    const errorWsp = document.getElementById("error-wsp");

    const nombre = inputName.value.trim();
    const wsp = inputWsp.value.trim();
    const soloNumeros = /^\d+$/; // Regex para validar solo números

    let esValido = true;

    // Validación Nombre (mínimo 3)
    if (nombre.length < 3) {
        errorName.style.display = "block";
        inputName.style.borderColor = "red";
        esValido = false;
    } else {
        errorName.style.display = "none";
        inputName.style.borderColor = "#ccc";
    }

    // Validación Teléfono (exactamente 10 números)
    if (wsp.length !== 10 || !soloNumeros.test(wsp)) {
        errorWsp.style.display = "block";
        inputWsp.style.borderColor = "red";
        esValido = false;
    } else {
        errorWsp.style.display = "none";
        inputWsp.style.borderColor = "#ccc";
    }

    if (!esValido) {
        showToast("Revisá los datos marcados en rojo ✍️");
        return; // No deja pasar al Alias
    }

    // Si todo está ok, procedemos con los cálculos
    const totalRaw = document.getElementById("cartTotal").textContent.replace(/\./g, "");
    const total = parseFloat(totalRaw);

    tipoDePago = tipo === 'total' ? 'Total' : 'Seña 50%';
    montoSeleccionado = tipo === 'total' ? total : (total / 2);

    document.getElementById("display-monto-transfer").textContent = montoSeleccionado.toLocaleString('es-AR');
    
    document.getElementById("initial-cart-buttons").style.display = "none";
    document.getElementById("customer-data").style.display = "none";
    document.getElementById("transfer-step").style.display = "block";
}

function cancelarPago() {
    document.getElementById("initial-cart-buttons").style.display = "flex";
    document.getElementById("customer-data").style.display = "block"; // Volvemos a mostrar el formulario
    document.getElementById("transfer-step").style.display = "none";
    
    // Limpiamos los bordes rojos por si acaso
    document.getElementById("error-name").style.display = "none";
    document.getElementById("error-wsp").style.display = "none";
    document.getElementById("cust-name").style.borderColor = "#ccc";
    document.getElementById("cust-wsp").style.borderColor = "#ccc";
}

// Vincular botones de pago
document.getElementById("btn-select-full").onclick = () => prepararTransferencia('total');
document.getElementById("btn-select-senia").onclick = () => prepararTransferencia('senia');

/* ===== CONFIRMACIÓN DE PEDIDO CORREGIDA ===== */
document.addEventListener("click", async (e) => {
    if (e.target && e.target.id === "btn-confirm-wsp") {
        
        const fileInput = document.getElementById("comprobanteInput");
        const nombreCliente = document.getElementById("cust-name").value.trim();
        const wspCliente = document.getElementById("cust-wsp").value.trim();

        if (!fileInput || fileInput.files.length === 0) {
            showToast("⚠️ Por favor, subí la foto del comprobante.");
            return;
        }

        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = "Enviando pedido... 🚀";

        try {
            const fotoBase64 = await toBase64(fileInput.files[0]);

            const datosParaSheets = {
                nombre: nombreCliente,
                whatsapp: wspCliente,
                pedido: cart.map(item => item.name).join(" | "),
                tipoPago: tipoDePago,
                monto: montoSeleccionado,
                archivoBase64: fotoBase64,
                nombreArchivo: `Comprobante_${nombreCliente.replace(/\s+/g, '_')}_${Date.now()}.webp`
            };

            // 1. Preparamos el mensaje de WhatsApp por adelantado
            let listaWsp = cart.map(item => `- ${item.name} ($${item.price.toLocaleString('es-AR')})`).join("%0A");
            const mensaje = `¡Hola VITAE! 👋%0A%0A` +
                `*Nuevo Pedido:*%0A${listaWsp}%0A%0A` +
                `*Cliente:* ${nombreCliente}%0A` +
                `*Pago:* ${tipoDePago} ($${montoSeleccionado.toLocaleString('es-AR')})%0A%0A` +
                `✅ Ya cargué el comprobante en la web. ¡Espero mi pedido!`;
            
            const urlWsp = `https://wa.me/5492215111026?text=${mensaje}`;

            // 2. ENVÍO A GOOGLE CON TIMEOUT (Si tarda más de 5 seg, abre el wsp igual)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de espera máxima

            showToast("Registrando pago... ⏳");

            try {
                await fetch('https://script.google.com/macros/s/AKfycbw4OmH3gC-soTf8uLbs-oXQpXNeeFl1Nju_2aVkq88Y7d7mKwFmWkjuITFYH5VgDF_5aQ/exec', {
                    method: 'POST',
                    mode: 'no-cors', // Usar no-cors suele ser más rápido para Apps Script
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosParaSheets),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
            } catch (err) {
                console.log("El registro en Excel tardó demasiado o falló, procediendo a WhatsApp.");
            }

            // 3. DIRECCIONAMIENTO FORZADO AL WHATSAPP
            window.location.href = urlWsp;

        } catch (error) {
            console.error("Error crítico:", error);
            showToast("Error al procesar. Intentando abrir WhatsApp...");
            // Si todo falla, intentamos abrir WhatsApp como último recurso
            window.open(`https://wa.me/5492215111026`, "_blank");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
});

/* ===== AGREGAR AL CARRITO ===== */
if (addToCartBtn) {
    addToCartBtn.onclick = function() {
        const variantSelect = document.getElementById("variantSelect");
        const borderDisplay = document.getElementById("borderNameDisplay");
        const priceDisplay = document.getElementById("viewPrice");
        
        // 1. CAPTURAMOS EL PRECIO FINAL REAL (El que el usuario ve en el visor)
        // Limpiamos el texto "$12.500" para que sea solo el número 12500
        let finalPrice = parseFloat(priceDisplay.textContent.replace("$", "").replace(/\./g, "").trim());
        
        let finalName = viewTitle.textContent;
        let finalImage = viewImage.src;

        // 2. Manejo de Nombre para el WhatsApp (Packs)
        if (variantSelect && variantSelect.style.display !== "none") {
            const selected = variantSelect.options[variantSelect.selectedIndex];
            finalName += ` (${selected.textContent})`;
        }

        // 3. Detalle de Diseño
        let nombreDisenio = borderDisplay ? borderDisplay.textContent.trim() : "Sin diseño";
        if (nombreDisenio.toLowerCase() !== "sin diseño") {
            finalName += ` - diseño: ${nombreDisenio}`;
        }

        // 4. Detalle de Tiras (Strips)
        const esStrip = finalName.toLowerCase().includes("strip");
        const activeLayoutBtn = document.querySelector(".layout-btn.selected"); 
        
        if (esStrip && activeLayoutBtn) {
            finalName += ` - Tira: ${activeLayoutBtn.textContent}`;
        }

        // 5. Detalle de Imantación para el carrito
        if (tieneImantacion) {
            finalName += ` + Imantado Completo`;
        }

        // 6. GUARDADO EN EL CARRITO
        const cartItem = {
            name: finalName,
            price: finalPrice, // Este precio ya incluye Pack + Diseño + Imán
            image: finalImage,
            disenio: nombreDisenio,
            imantado: tieneImantacion ? "Sí" : "No"
        };
  
        cart.push(cartItem);
        
        // Sincronización
        updateCart();
        saveCart();
        updateCartCounter();
        
        // Cerrar y Feedback
        productView.style.display = "none";
        document.body.style.overflow = "auto"; 
        showToast(`¡Agregado al carrito! ✨`);
    };
}

/* ===== UTILIDADES ===== */
function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    Object.assign(toast.style, {
        position: "fixed", bottom: "100px", left: "50%", transform: "translateX(-50%)",
        backgroundColor: "#112a4a", color: "#ffffff", padding: "12px 24px",
        borderRadius: "30px", zIndex: "9999", opacity: "0", transition: "all 0.4s ease"
    });
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = "1"; toast.style.transform = "translateX(-50%) translateY(-10px)"; }, 100);
    setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 400); }, 3000);
}

// Guardar carrito
function saveCart() {
    localStorage.setItem("vitae_cart", JSON.stringify(cart));
}

// Cargar carrito al iniciar la página
function loadCart() {
    const saved = localStorage.getItem("vitae_cart");
    if (saved) {
        cart = JSON.parse(saved);
        updateCart();
        updateCartCounter(); // Para el punto 3
    }
}

// Llama a loadCart() al final de tu archivo JS
loadCart();
updateCartCounter(); // Para mostrar el contador correcto al cargar la página

function eliminarProducto(index) {
    // 1. Quitamos el producto del array usando su posición (index)
    cart.splice(index, 1);
    
    // 2. Notificamos al usuario
    showToast("Producto eliminado");
    
    // 3. Sincronizamos todo
    updateCart();        // Refresca la lista visual
    updateCartCounter(); // Actualiza el numerito rojo del icono
    saveCart();          // Guarda el cambio en localStorage para que no vuelva al recargar
    
    // 4. Si el carrito quedó vacío, volvemos a mostrar los botones de pago iniciales
    if (cart.length === 0) {
        cancelarPago();
    }
}

function updateCartCounter() {
    const countElement = document.getElementById("cart-count");
    const cartBtn = document.getElementById("cartIcon");
    if (!countElement || !cartBtn) return;
    
    if (cart.length > 0) {
        countElement.textContent = cart.length;
        countElement.style.display = "flex"; // Usamos flex para centrar el número
        countElement.style.alignItems = "center";
        countElement.style.justifyContent = "center";
        // ACTIVAMOS LA ONDA SUAVE
        cartBtn.classList.add("cart-has-items");
    } else {
        countElement.style.display = "none";
        // QUITAMOS LA ONDA SI ESTÁ VACÍO
        cartBtn.classList.remove("cart-has-items");
    }
}

const searchInput = document.getElementById("searchInput");
const searchSuggestions = document.getElementById("searchSuggestions");

// Obtenemos los datos de los productos una sola vez para ser eficientes
const productData = Array.from(document.querySelectorAll(".product-card")).map(card => ({
    name: card.dataset.name,
    price: card.dataset.price,
    image: card.dataset.image,
    element: card // Guardamos la referencia al elemento original
}));

// Función para quitar tildes y normalizar texto
const normalizar = (texto) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

searchInput.addEventListener("input", (e) => {
    // Normalizamos lo que el usuario escribe
    const term = normalizar(e.target.value.trim());
    searchSuggestions.innerHTML = "";

    if (term.length > 0) {
        // Filtramos comparando ambos textos normalizados
        const matches = productData.filter(p => {
            const nombreProducto = normalizar(p.name);
            return nombreProducto.includes(term);
        });
        
        if (matches.length > 0) {
            searchSuggestions.style.display = "block";
            matches.forEach(match => {
                const div = document.createElement("div");
                div.className = "suggestion-item";
                div.innerHTML = `
                    <img src="${match.image}" alt="${match.name}">
                    <div>
                        <div style="font-weight: bold; font-size: 0.9rem;">${match.name}</div>
                        <div style="font-size: 0.8rem; color: #666;">${match.price}</div>
                    </div>
                `;
                div.onclick = () => {
                    match.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    searchBar.style.display = "none";
                    searchInput.value = "";
                    searchSuggestions.style.display = "none";
                };
                searchSuggestions.appendChild(div);
            });
        } else {
            searchSuggestions.style.display = "none";
        }
    } else {
        searchSuggestions.style.display = "none";
    }
});

/* === PASO 3: FUNCIONES DE APOYO AL FINAL DEL JS === */
function cambiarFotoConEfecto(direccion) {
    const img = document.getElementById("viewImage");
    if (!img || currentImages.length <= 1) return; // Seguridad: si no hay fotos, no animar

    // 1. Definir clases de animación
    const salida = direccion === "next" ? "slide-out-left" : "slide-out-right";
    const entrada = direccion === "next" ? "slide-in-right" : "slide-in-left";

    // 2. Aplicar salida (la hoja se va)
    img.className = salida;

    setTimeout(() => {
        // 3. Lógica de índices (la misma que tenías antes)
        if (direccion === "next") {
            currentIndex = (currentIndex + 1) % currentImages.length;
        } else {
            currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
        }

        // 4. Cambiar el SRC mientras la imagen está fuera de vista
        img.src = currentImages[currentIndex].trim();

        // 5. Posicionar para la entrada
        img.className = entrada;

        // Truco de Ingeniería: Forzar reflow para reiniciar la animación
        img.offsetWidth;

        // 6. La hoja nueva entra al centro
        img.className = "slide-active";
        
        // Sincronizamos con el contador de páginas y visibilidad
        actualizarSlider(); 
    }, 400); 
}

// Botones de flechas (Asegúrate de que los IDs coincidan con tu HTML)
const nextBtn = document.getElementById("nextImg");
const prevBtn = document.getElementById("prevImg");

if(nextBtn) {
    nextBtn.onclick = (e) => {
        e.preventDefault();
        cambiarFotoConEfecto("next"); // Llamamos a la animación
        actualizarSlider();
    };
}
if(prevBtn) {
    prevBtn.onclick = (e) => {
        e.preventDefault();
        cambiarFotoConEfecto("prev"); // Llamamos a la animación
        actualizarSlider();
    };
}

function actualizarSlider() {
    const pageNumElement = document.getElementById("pageNumber");
    const nextBtn = document.getElementById("nextImg");
    const prevBtn = document.getElementById("prevImg");
    const simulationContainer = document.getElementById("simulationContainer");

    // LÓGICA DE VISIBILIDAD
    // Solo tienen sentido si hay más de 1 foto Y no estamos personalizando
    const esPersonalizando = simulationContainer && simulationContainer.style.display === "flex";
    const tieneMultiplesFotos = currentImages && currentImages.length > 1;

    if (tieneMultiplesFotos && !esPersonalizando) {
        if (pageNumElement) {
            pageNumElement.style.display = "block";
            pageNumElement.textContent = `Página ${currentIndex + 1} de ${currentImages.length}`;
        }
        if (nextBtn) nextBtn.style.display = "block";
        if (prevBtn) prevBtn.style.display = "block";
    } else {
        // Si hay una sola foto, OCULTAMOS TODO por defecto
        if (pageNumElement) pageNumElement.style.display = "none";
        if (nextBtn) nextBtn.style.display = "none";
        if (prevBtn) prevBtn.style.display = "none";
    }
}

function crearBotonConfig(texto, accion) {
    const btn = document.createElement("button");
    btn.textContent = texto.trim();
    btn.className = "config-btn"; 
    // Forzamos el color del texto a azul oscuro y fondo blanco/gris claro
    btn.style.cssText = `
        margin: 5px; 
        padding: 8px 12px; 
        border: 1px solid #112a4a; 
        border-radius: 5px; 
        cursor: pointer; 
        background-color: #f8f9fa; 
        color: #112a4a; 
        font-weight: 500;
    `;
    btn.onclick = (e) => {
        e.preventDefault();
        // Quitar selección de otros botones en la misma sección
        const parent = btn.parentElement;

        parent.querySelectorAll(".config-btn").forEach(b => {
            b.style.backgroundColor = "#f8f9fa";
            b.style.color = "#112a4a";
        });
        // Al seleccionar, resaltamos
        btn.style.backgroundColor = "#112a4a"; // Fondo azul oscuro
        btn.style.color = "#ffffff";           // Texto blanco
        accion();
    };
    return btn;
}

/* ===== CERRAR MENÚ AL HACER CLIC EN UN ENLACE ===== */
function closeMenu() {
    const mobileMenu = document.getElementById("mobileMenu");
    if (mobileMenu) {
        mobileMenu.style.display = "none";
    }
}

/* === 1. NAVEGACIÓN DE SECCIONES (Arregla el salto al final) === */
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
        const sectionId = link.getAttribute("data-section");
        const href = link.getAttribute("href");
        const homeContent = document.getElementById("home-content");

        // Ocultamos secciones de "páginas" aparte
        document.querySelectorAll(".content-section").forEach(sec => sec.style.display = "none");

        if (sectionId === "inicio" || sectionId === "cuadernos") {
            homeContent.style.display = "block";
            
            if (href && href.startsWith("#")) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    setTimeout(() => {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50); 
                }
            }
        } else {
            e.preventDefault();
            homeContent.style.display = "none";
            const targetSec = document.getElementById(`sec-${sectionId}`);
            if (targetSec) targetSec.style.display = "block";
            window.scrollTo(0, 0);
        }
        closeMenu();
    });
});

/* === 2. LÓGICA DE INTERFAZ DE PERSONALIZACIÓN (Unificada) === */
const toggleBtn = document.getElementById("toggleViewMode");
const simulationContainer = document.getElementById("simulationContainer");
const borderContainer = document.getElementById("border-designs-container");

if (toggleBtn) {
    toggleBtn.onclick = () => {
        // En ingeniería, es mejor preguntar por el estado explícito
        const modoActual = simulationContainer.style.display;

        if (modoActual === "none" || modoActual === "") {
            simulationContainer.style.display = "flex"; // Abrir
            viewImage.style.display = "none";
            borderContainer.style.display = "block";
            toggleBtn.textContent = "Ver Foto del producto";
            
            // Re-ejecutamos el ajuste del molde para que no salga deforme
            const currentTitle = viewTitle.textContent;
            ajustarMoldeSegunProducto(currentTitle);
        } else {
            simulationContainer.style.display = "none"; // Cerrar
            viewImage.style.display = "block";
            borderContainer.style.display = "none";
            toggleBtn.textContent = `✨ Personalizar diseño (+$${COSTO_DISENIO})`;
        }
        actualizarSlider();
    };
}

// ÚNICA DECLARACIÓN DEL BOTÓN HECHO
if (btnDoneDesign) {
    btnDoneDesign.onclick = () => {
        const borderDisplay = document.getElementById("borderNameDisplay");
        if (borderDisplay) {
            borderDisplay.textContent = disenioTemporal; 
        }
        simulationContainer.style.display = "none";
        viewImage.style.display = "block";
        borderContainer.style.display = "none";
        toggleBtn.textContent = `✨ Personalizar diseño (+$${COSTO_DISENIO})`;
        
        if (selectedBorderText) {
            const display = document.getElementById("borderNameDisplay");
            selectedBorderText.style.display = (display && display.textContent !== "Sin diseño") ? "block" : "none";
        }
        
        actualizarSlider();
        recalcularPrecioTotal(); 
        // Sin scroll automático para que no salte
    };
}

/* === 3. CARGA INICIAL === */
loadCart();
updateCartCounter();


function toggleMagnet(seleccion) {
    tieneImantacion = seleccion;
    const btnYes = document.getElementById("magnet-yes");
    const btnNo = document.getElementById("magnet-no");

    // Resetear clases
    btnYes.classList.remove("active-yes");
    btnNo.classList.remove("active-no");

    if (seleccion) {
        btnYes.classList.add("active-yes");
    } else {
        btnNo.classList.add("active-no");
    }
    
    recalcularPrecioTotal();
}

function recalcularPrecioTotal() {
    const title = document.getElementById("viewTitle").textContent.trim();
    const variantSelect = document.getElementById("variantSelect");
    const priceDisplay = document.getElementById("viewPrice");
    const extraDisplay = document.getElementById("magnet-total-extra");
    const borderDisplay = document.getElementById("borderNameDisplay");
    const toggleBtn = document.getElementById("toggleViewMode");

    if (!variantSelect || !variantSelect.options[variantSelect.selectedIndex]) return;

    // 1. PRECIO BASE DEL PACK (ej: 4 unidades de Strips)
    let precioFinal = parseFloat(variantSelect.value);

    // 2. RECARGO POR DISEÑO ($1.000)
    // Si el usuario eligió un diseño (el texto no es "Sin diseño")
    const tieneDisenio = borderDisplay && borderDisplay.textContent.trim().toLowerCase() !== "sin diseño";
    
    if (tieneDisenio) {
        precioFinal += COSTO_DISENIO; 
    }

    // 3. RECARGO POR IMANTACIÓN
    const packText = variantSelect.options[variantSelect.selectedIndex].textContent;
    const matchCantidad = packText.match(/\d+/); 
    const cantidad = matchCantidad ? parseInt(matchCantidad[0]) : 0;
    
    let costoImanUnitario = 0;
    const nombreProductoBusqueda = title.toLowerCase();
    for (let nombreKey in PRECIOS_IMAN) {
        if (nombreKey.toLowerCase() === nombreProductoBusqueda) {
            costoImanUnitario = PRECIOS_IMAN[nombreKey];
            break;
        }
    }
    
    let extraInformativo = cantidad * costoImanUnitario;
    if (extraDisplay) extraDisplay.textContent = `$${extraInformativo.toLocaleString('es-AR')}`;

    // Solo sumamos el imán si marcaron "SÍ"
    if (tieneImantacion) {
        precioFinal += extraInformativo;
    }

    // 4. ACTUALIZAR EL PRECIO GRANDE EN PANTALLA
    if (priceDisplay) {
        priceDisplay.textContent = `$${precioFinal.toLocaleString('es-AR')}`;
    }
}

// Sincronizar: Si cambian el pack, que se recalcule el imán
document.getElementById("variantSelect").addEventListener("change", recalcularPrecioTotal);

function actualizarVisibilidadImantacion(nombreProducto) {
    const magnetContainer = document.getElementById("magnet-option-container");
    const hint = document.getElementById("magnet-price-hint"); // El cartelito del precio
    const nombreNormalizado = nombreProducto.toLowerCase();

    const esPolaroid = nombreNormalizado.includes("común") || 
                       nombreNormalizado.includes("extralarge") || 
                       nombreNormalizado.includes("strips") || 
                       nombreNormalizado.includes("cuadrada");

    if (magnetContainer) {
        if (esPolaroid) {
            magnetContainer.style.display = "block";
            
            // --- RESETEO A "NO" ---
            tieneImantacion = false;
            
            const btnYes = document.getElementById("magnet-yes");
            const btnNo = document.getElementById("magnet-no");
            
            if (btnYes) btnYes.classList.remove("active-yes");
            if (btnNo) {
                btnNo.classList.remove("active-no");
                btnNo.classList.add("active-no");
            }

            // FORZAMOS QUE EL CARTELITO SE VEA SIEMPRE
            if (hint) {
                hint.style.display = "block"; // <--- ESTO ES CLAVE
            }
            
            // Calculamos el precio inmediatamente
            setTimeout(() => {
                recalcularPrecioTotal();
            }, 50);

        } else {
            magnetContainer.style.display = "none";
            if (hint) hint.style.display = "none";
            tieneImantacion = false;
        }
    }
}

function ajustarMoldeSegunProducto(nombreProducto) {
    const molde = document.getElementById("polaroidPreview");
    const fotoEspacio = document.getElementById("photoSpace");
    const chin = document.getElementById("polaroidChin");

    if (!molde || !fotoEspacio || !chin) return;

    const nombre = nombreProducto.toLowerCase();

    // Regla General: Margen de 0.6cm arriba para casi todos
    molde.style.paddingTop = "0.6cm"; 
    molde.style.paddingLeft = "12px";  // Margen lateral estándar
    molde.style.paddingRight = "12px"; // Margen lateral estándar
    // Limpiamos los estilos previos para que no se hereden entre productos
    molde.style.width = "";
    molde.style.height = "";
    molde.style.aspectRatio = "";
    molde.style.backgroundColor = "white"; // Fondo base siempre blanco
    
    fotoEspacio.innerHTML = '<span style="color: #ccc; font-size: 10px; font-weight: bold;">TU FOTO</span>';
    fotoEspacio.classList.remove("grid-strips");
   // Forzamos el blanco del centro para que no sea transparente
    fotoEspacio.style.backgroundColor = "#ffffff"; 
    fotoEspacio.style.display = "flex";
    fotoEspacio.style.aspectRatio = "";
    fotoEspacio.style.width = "100%";
    fotoEspacio.style.border = "1px solid #f0f0f0";
    fotoEspacio.style.boxShadow = "inset 0 0 5px rgba(0,0,0,0.1)";

    // Si no es una Strip, quitamos el diseño beige de fondo si quedó pegado
    if (!nombre.includes("strips") && borderLayer) {
        borderLayer.style.backgroundImage = "none";
    }

    if (nombre.includes("comun")) {
        molde.style.width = "220px"; 
        molde.style.aspectRatio = "5.5 / 8.5";
        fotoEspacio.style.aspectRatio = "1 / 1.1"; // Un poquito más alta la foto
        chin.style.height = "55px"; 
    } 
    else if (nombre.includes("extralarge")) {
        molde.style.width = "350px";
        molde.style.aspectRatio = "12.5 / 6.5"; 
        fotoEspacio.style.aspectRatio = "1.8 / 1"; 
        chin.style.height = "35px";
    } 
    else if (nombre.includes("strips")) {
        // EXCEPCIÓN: Margen de arriba igual a los costados (aprox 12px o 0.3cm)
        molde.style.paddingTop = "12px"; 
        
        molde.style.width = "150px";
        molde.style.aspectRatio = "4.5 / 14.5"; 
        molde.style.height = "auto"; // Permite que la tira crezca según la cantidad de fotos
        fotoEspacio.style.aspectRatio = "1 / 2.8"; // Muy alargada hacia abajo
        chin.style.height = "25px";
        molde.style.paddingBottom = "40px"; // Espacio extra de seguridad abajo
    } 
    else if (nombre.includes("cuadrada")) {
        molde.style.width = "250px";
        molde.style.aspectRatio = "8 / 10"; 
        fotoEspacio.style.aspectRatio = "1 / 1";
        chin.style.height = "45px";
    }
}

// Opcional: Mostrar vista previa al elegir el archivo
// Usamos delegación para que funcione siempre, incluso en modales
document.addEventListener("change", (e) => {
    if (e.target && e.target.id === "comprobanteInput") {
        const file = e.target.files[0];
        const preview = document.getElementById('previewComprobante');
        const container = document.getElementById('previewContainer');
        const btnWsp = document.getElementById("btn-confirm-wsp");

        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (preview) {
                    preview.src = event.target.result;
                    if (container) container.style.display = "block";
                    
                    // Opcional: Ponemos el botón de WSP en modo "Listo"
                    if (btnWsp) {
                        btnWsp.style.backgroundColor = "#128C7E"; // Un verde más oscuro de "ok"
                        btnWsp.innerHTML = "¡Todo listo! Enviar a WhatsApp 📲";
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    }
});

function resetDesign() {
    disenioTemporal = "Sin diseño"; // Resetear el borrador
    // 1. Limpiar el contenedor de la foto (quitar bordes previos)
    const photoSpace = document.getElementById('photoSpace');
    if (photoSpace) {
        photoSpace.innerHTML = ''; // Borra fotos cargadas
        photoSpace.className = ''; // Quita clases como 'grid-strips'
        photoSpace.style.backgroundColor = 'white'; // Color base
    }

    // 2. Resetear el marco (borderLayer)
    const borderLayer = document.getElementById('borderLayer');
    if (borderLayer) {
        borderLayer.style.backgroundImage = 'none';
    }

    // 3. Quitar la selección visual de los cuadraditos (thumbs)
    document.querySelectorAll('.border-thumb').forEach(thumb => {
        thumb.classList.remove('selected');
    });

    // 4. Asegurarnos de que el texto de la UI también se limpie
    const borderDisplay = document.getElementById("borderNameDisplay");
    if (borderDisplay) {
        borderDisplay.textContent = "Sin diseño";
    }
}

// Forzamos que al cargar la página, la Polaroid sea la Común
ajustarMoldeSegunProducto("comun");
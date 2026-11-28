/**
 * CatalogoGeo — Catálogo geográfico offline de países, divisiones administrativas
 * oficiales (departamentos, estados, provincias, regiones) y municipios/ciudades reales.
 * Sin dependencias externas ni peticiones de red.
 */
(function (global) {
    'use strict';

    const DATA = {
        'Colombia': {
            etiqueta: 'Departamento',
            divisiones: {
                'Amazonas': ['Leticia', 'Puerto Nariño', 'El Encanto', 'La Chorrera', 'La Pedrera', 'Mirití-Paraná', 'Puerto Alegría', 'Puerto Arica', 'Puerto Santander', 'Tarapacá'],
                'Antioquia': [
                    'Medellín', 'Envigado', 'Bello', 'Itagüí', 'Sabaneta', 'La Estrella', 'Caldas', 'Copacabana', 'Girardota', 'Barbosa',
                    'Rionegro', 'Marinilla', 'El Carmen de Viboral', 'La Ceja', 'El Retiro', 'Guarne', 'El Santuario', 'El Peñol', 'Guatapé', 'San Vicente Ferrer',
                    'Abejorral', 'Sonsón', 'La Unión', 'Alejandría', 'Concepción', 'Granada', 'San Carlos', 'San Luis', 'San Rafael', 'Cocorná', 'Argelia', 'Nariño',
                    'Apartadó', 'Turbo', 'Carepa', 'Chigorodó', 'Necoclí', 'San Juan de Urabá', 'San Pedro de Urabá', 'Arboletes', 'Mutatá', 'Murindó', 'Vigía del Fuerte',
                    'Caucasia', 'El Bagre', 'Zaragoza', 'Nechí', 'Cáceres', 'Tarazá',
                    'Santa Fe de Antioquia', 'Sopetrán', 'San Jerónimo', 'Ebéjico', 'Armenia Mantequilla', 'Heliconia', 'Liborina', 'Olaya', 'Sabanalarga', 'Buriticá', 'Giraldo', 'Cañasgordas', 'Dabeiba', 'Frontino', 'Peque', 'Abriaquí', 'Uramita', 'Anzá', 'Caicedo', 'Urrao',
                    'Yarumal', 'Santa Rosa de Osos', 'Entrerríos', 'San Pedro de los Milagros', 'Donmatías', 'Belmira', 'San José de la Montaña', 'San Andrés de Cuerquia', 'Toledo', 'Briceño', 'Ituango', 'Valdivia', 'Campamento', 'Angostura', 'Carolina del Príncipe', 'Guadalupe', 'Gómez Plata',
                    'Yolombó', 'Yalí', 'Vegachí', 'Amalfi', 'Anorí', 'Remedios', 'Segovia', 'Cisneros', 'Santo Domingo', 'San Roque', 'Maceo', 'Puerto Berrío', 'Puerto Nare', 'Puerto Triunfo', 'Caracolí', 'Yondó',
                    'Amagá', 'Angelópolis', 'Fredonia', 'Titiribí', 'Venecia', 'Concordia', 'Betulia', 'Salgar', 'Ciudad Bolívar', 'Hispania', 'Andes', 'Jardín', 'Betania', 'Jericó', 'Támesis', 'Tarso', 'Pueblorrico', 'Montebello', 'Santa Bárbara', 'La Pintada', 'Valparaíso', 'Caramanta'
                ],
                'Arauca': ['Arauca', 'Arauquita', 'Cravo Norte', 'Fortul', 'Puerto Rondón', 'Saravena', 'Tame'],
                'Atlántico': [
                    'Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Baranoa', 'Galapa', 'Puerto Colombia',
                    'Santo Tomás', 'Palmar de Varela', 'Polonuevo', 'Ponedera', 'Luruaco', 'Manatí', 'Repelón',
                    'Campo de la Cruz', 'Candelaria', 'Juan de Acosta', 'Piojó', 'Sabanagrande', 'Santa Lucía', 'Suan', 'Tubará', 'Usiacurí'
                ],
                'Bogotá D.C.': [
                    'Bogotá', 'Usaquén', 'Chapinero', 'Santa Fe', 'San Cristóbal', 'Usme', 'Tunjuelito',
                    'Bosa', 'Kennedy', 'Fontibón', 'Engativá', 'Suba', 'Barrios Unidos', 'Teusaquillo',
                    'Los Mártires', 'Antonio Nariño', 'Puente Aranda', 'La Candelaria', 'Rafael Uribe Uribe', 'Ciudad Bolívar', 'Sumapaz'
                ],
                'Bolívar': [
                    'Cartagena de Indias', 'Magangué', 'Turbaco', 'Arjona', 'El Carmen de Bolívar', 'María La Baja',
                    'Mompós', 'San Juan Nepomuceno', 'Santa Rosa del Sur', 'Simití', 'San Pablo', 'Morales',
                    'Achí', 'Pinillos', 'Villanueva', 'Clemencia', 'Santa Catalina', 'Turbaná', 'Mahates',
                    'Calamar', 'Zambrano', 'San Jacinto', 'Córdoba', 'Hatillo de Loba', 'Barranco de Loba',
                    'Montecristo', 'Tiquisio', 'Arenal', 'Cantagallo', 'Cicuco', 'El Guamo', 'El Peñón',
                    'Margarita', 'Norosí', 'Regidor', 'Río Viejo', 'San Cristóbal', 'San Estanislao',
                    'San Fernando', 'San Jacinto del Cauca', 'San Martín de Loba', 'Santa Rosa', 'Soplaviento', 'Talaigua Nuevo', 'Altos del Rosario'
                ],
                'Boyacá': [
                    'Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa', 'Puerto Boyacá', 'Moniquirá',
                    'Villa de Leyva', 'Samacá', 'Nobsa', 'Tibasosa', 'Garagoa', 'Guateque', 'Miraflores',
                    'Soatá', 'Chita', 'El Cocuy', 'Muzo', 'Otanche', 'Ramiriquí', 'Santa Rosa de Viterbo',
                    'Aquitania', 'Pesca', 'Toca', 'Cómbita', 'Ventaquemada', 'Ráquira', 'Sutamarchán',
                    'Arcabuco', 'Santana', 'Chitaraque', 'Saboyá', 'Belén', 'Boavita', 'Corrales',
                    'Firavitoba', 'Iza', 'Monguí', 'Tota', 'Jenesano', 'Tibaná', 'Turmequé',
                    'Nuevo Colón', 'Úmbita', 'Chivor', 'Macanal', 'Zetaquira'
                ],
                'Caldas': [
                    'Manizales', 'La Dorada', 'Chinchiná', 'Villamaría', 'Riosucio', 'Anserma', 'Supía',
                    'Salamina', 'Aguadas', 'Pácora', 'Neira', 'Palestina', 'Pensilvania', 'Manzanares',
                    'Marquetalia', 'Samaná', 'Victoria', 'Norcasia', 'Aranzazu', 'Filadelfia', 'La Merced',
                    'Marmato', 'Marulanda', 'Risaralda', 'San José', 'Viterbo', 'Belalcázar'
                ],
                'Caquetá': [
                    'Florencia', 'San Vicente del Caguán', 'Cartagena del Chairá', 'Puerto Rico', 'El Doncello',
                    'El Paujil', 'Belén de los Andaquíes', 'San José del Fragua', 'Curillo', 'Solano',
                    'Solita', 'Valparaíso', 'Morelia', 'Albania', 'Milán', 'La Montañita'
                ],
                'Casanare': [
                    'Yopal', 'Aguazul', 'Villanueva', 'Paz de Ariporo', 'Monterrey', 'Tauramena',
                    'Trinidad', 'Maní', 'Orocué', 'Hato Corozal', 'Pore', 'Támara', 'Nunchía',
                    'San Luis de Palenque', 'Sabanalarga', 'Recetor', 'Chámeza', 'La Salina', 'Sácama'
                ],
                'Cauca': [
                    'Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Patía (El Bordo)', 'Miranda', 'Corinto',
                    'Caloto', 'Guachené', 'Villa Rica', 'Padilla', 'Piendamó', 'Timbío', 'Silvia', 'Morales',
                    'Cajibío', 'El Tambo', 'Bolívar', 'Mercaderes', 'Balboa', 'Argelia', 'Guapi', 'Timbiquí',
                    'López de Micay', 'Inzá', 'Páez', 'Toribío', 'Caldono', 'Jambaló', 'Totoró', 'Rosas',
                    'La Sierra', 'Almaguer', 'Sucre', 'Buenos Aires', 'Suárez', 'Florencia', 'La Vega',
                    'Piamonte', 'Puracé', 'San Sebastián', 'Santa Rosa', 'Sotará'
                ],
                'Cesar': [
                    'Valledupar', 'Aguachica', 'Agustín Codazzi', 'Bosconia', 'Curumaní', 'El Copey',
                    'La Jagua de Ibirico', 'Chiriguaná', 'Chimichagua', 'Pailitas', 'Pelaya', 'San Alberto',
                    'San Martín', 'La Paz', 'Pueblo Bello', 'Becerril', 'Astrea', 'El Paso', 'Gamarra',
                    'González', 'La Gloria', 'Manaure Balcón del Cesar', 'Río de Oro', 'San Diego', 'Tamalameque'
                ],
                'Chocó': [
                    'Quibdó', 'Istmina', 'Tadó', 'Condoto', 'Bahía Solano', 'Nuquí', 'Acandí', 'Unguía',
                    'Riosucio', 'Carmen del Darién', 'Bajo Baudó', 'Alto Baudó', 'Medio Baudó', 'Bojayá',
                    'Bagadó', 'Lloró', 'Atrato', 'Cértegui', 'El Cantón de San Pablo', 'El Carmen de Atrato',
                    'Juradó', 'Litoral del San Juan', 'Medio Atrato', 'Medio San Juan', 'Nóvita', 'Río Iró',
                    'Río Quito', 'San José del Palmar', 'Sipí', 'Unión Panamericana'
                ],
                'Córdoba': [
                    'Montería', 'Lorica', 'Sahagún', 'Cereté', 'Montelíbano', 'Planeta Rica', 'Tierralta',
                    'Ciénaga de Oro', 'Chinú', 'San Pelayo', 'San Carlos', 'Puerto Libertador', 'Ayapel',
                    'Pueblo Nuevo', 'Buenavista', 'San Antero', 'San Bernardo del Viento', 'Moñitos',
                    'Los Córdobas', 'Puerto Escondido', 'Valencia', 'Canalete', 'Cotorra', 'Chimá',
                    'Momil', 'Purísima', 'San Andrés de Sotavento', 'San José de Uré', 'Tuchín', 'La Apartada'
                ],
                'Cundinamarca': [
                    'Soacha', 'Chía', 'Zipaquirá', 'Facatativá', 'Fusagasugá', 'Madrid', 'Mosquera', 'Funza',
                    'Cajicá', 'Girardot', 'Cota', 'Tocancipá', 'Sopó', 'La Calera', 'Tabio', 'Tenjo',
                    'Villeta', 'Ubaté', 'Pacho', 'Chocontá', 'Sibaté', 'Silvania', 'Arbeláez', 'El Colegio',
                    'La Mesa', 'Anapoima', 'Tocaima', 'Agua de Dios', 'Ricaurte', 'Guaduas', 'Puerto Salgar',
                    'Caparrapí', 'Vergara', 'Nocaima', 'Sasaima', 'Albán', 'Bojacá', 'Subachoque', 'El Rosal',
                    'Gachancipá', 'Sesquilé', 'Suesca', 'Guatavita', 'Guasca', 'Junín', 'Gachetá', 'Medina',
                    'Cáqueza', 'Chipaque', 'Choachí', 'Ubaque', 'Fómeque', 'Une', 'Pasca', 'Nemocón',
                    'Cogua', 'Sutatausa', 'Tausa', 'Cucunubá', 'Lenguazaque', 'Guachetá', 'Simijaca', 'Susa',
                    'Carmen de Carupa', 'San Francisco', 'La Vega', 'Supatá', 'San Juan de Rioseco', 'Beltrán',
                    'Chaguaní', 'Vianí', 'Bituima', 'Quipile', 'Pulí', 'Jerusalén', 'Apulo', 'Cachipay',
                    'Tena', 'San Antonio del Tequendama', 'Granada', 'Pandi', 'Venecia', 'Cabrera',
                    'San Bernardo', 'Tibacuy', 'Nilo', 'Viotá', 'Villapinzón', 'Machetá', 'Manta', 'Tibirita',
                    'Guayabetal', 'Quetame', 'Fosca', 'Gutiérrez', 'Paratebueno', 'Ubalá', 'Gachalá', 'Gama',
                    'Paime', 'Topaipí', 'Yacopí', 'El Peñón', 'San Cayetano', 'La Palma', 'Útica',
                    'Quebradanegra', 'Nimaima', 'Zipacón'
                ],
                'Guainía': ['Inírida', 'Barranco Minas', 'Cacahual', 'La Guadalupe', 'Mapiripana', 'Morichal', 'Pana Pana', 'Puerto Colombia', 'San Felipe'],
                'Guaviare': ['San José del Guaviare', 'Calamar', 'El Retorno', 'Miraflores'],
                'Huila': [
                    'Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre', 'Palermo', 'Rivera', 'Gigante',
                    'Aipe', 'Algeciras', 'Timaná', 'San Agustín', 'Isnos', 'Acevedo', 'Guadalupe', 'Suaza',
                    'Tarqui', 'Altamira', 'El Agrado', 'El Pital', 'Hobo', 'Íquira', 'La Argentina', 'Nátaga',
                    'Oporapa', 'Paicol', 'Palestina', 'Saladoblanco', 'Santa María', 'Tello', 'Teruel',
                    'Tesalia', 'Villavieja', 'Yaguará', 'Baraya', 'Colombia', 'Elías'
                ],
                'La Guajira': [
                    'Riohacha', 'Maicao', 'Uribia', 'Fonseca', 'San Juan del Cesar', 'Barrancas', 'Villanueva',
                    'Albania', 'Dibulla', 'Distracción', 'El Molino', 'Hatonuevo', 'La Jagua del Pilar', 'Manaure', 'Urumita'
                ],
                'Magdalena': [
                    'Santa Marta', 'Ciénaga', 'Fundación', 'Zona Bananera', 'Plato', 'El Banco', 'Aracataca',
                    'Pivijay', 'El Retén', 'Algarrobo', 'Ariguaní', 'Cerro de San Antonio', 'Chibolo',
                    'Concordia', 'El Piñón', 'Guamal', 'Nueva Granada', 'Pedraza', 'Pijiño del Carmen',
                    'Pueblo Viejo', 'Remolino', 'Sabanas de San Ángel', 'Salamina', 'San Sebastián de Buenavista',
                    'San Zenón', 'Santa Ana', 'Santa Bárbara de Pinto', 'Sitionuevo', 'Tenerife', 'Zapayán'
                ],
                'Meta': [
                    'Villavicencio', 'Acacías', 'Granada', 'Puerto López', 'Puerto Gaitán', 'San Martín',
                    'Restrepo', 'Cumaral', 'Castilla la Nueva', 'Guamal', 'San Carlos de Guaroa',
                    'Puerto Concordia', 'Puerto Lleras', 'Puerto Rico', 'Vistahermosa', 'La Macarena',
                    'Mesetas', 'Uribe', 'Lejanías', 'Fuente de Oro', 'San Juan de Arama', 'Cabuyaro',
                    'Barranca de Upía', 'El Castillo', 'El Dorado', 'El Calvario', 'San Juanito', 'Mapiripán', 'Cubarral'
                ],
                'Nariño': [
                    'Pasto', 'Ipiales', 'Tumaco', 'Túquerres', 'La Unión', 'Sandoná', 'Samaniego', 'Barbacoas',
                    'La Cruz', 'Pupiales', 'Cumbal', 'Guachucal', 'El Charco', 'Ricaurte', 'Aldana', 'Ancuya',
                    'Arboleda', 'Belén', 'Buesaco', 'Chachagüí', 'Colón', 'Consacá', 'Contadero', 'Córdoba',
                    'Cuaspud', 'Cumbitara', 'El Peñol', 'El Rosario', 'El Tablón de Gómez', 'El Tambo', 'Funes',
                    'Guaitarilla', 'Gualmatán', 'Iles', 'Imués', 'La Florida', 'La Llanada', 'La Tola', 'Leiva',
                    'Linares', 'Los Andes', 'Magüí Payán', 'Mallama', 'Mosquera', 'Nariño', 'Olaya Herrera',
                    'Ospina', 'Policarpa', 'Potosí', 'Providencia', 'Puerres', 'Roberto Payán', 'San Bernardo',
                    'San Lorenzo', 'San Pablo', 'San Pedro de Cartago', 'Santa Bárbara', 'Santacruz', 'Sapuyes',
                    'Taminango', 'Tangua', 'Yacuanquer', 'Albán'
                ],
                'Norte de Santander': [
                    'Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario', 'Los Patios', 'Tibú', 'El Zulia',
                    'Ábrego', 'Chinácota', 'Sardinata', 'Convención', 'Toledo', 'Bochalema',
                    'Salazar de Las Palmas', 'Arboledas', 'Cucutilla', 'Pamplonita', 'Silos', 'Mutiscua',
                    'Cácota', 'Chitagá', 'Labateca', 'Herrán', 'Ragonvalia', 'Durania', 'Santiago',
                    'San Cayetano', 'Gramalote', 'Lourdes', 'Bucarasica', 'Villacaro', 'Cáchira', 'La Esperanza',
                    'El Carmen', 'El Tarra', 'Hacarí', 'La Playa de Belén', 'San Calixto', 'Teorama', 'Puerto Santander'
                ],
                'Putumayo': [
                    'Mocoa', 'Puerto Asís', 'Orito', 'Valle del Guamuez', 'Villagarzón', 'Sibundoy',
                    'San Miguel', 'Puerto Guzmán', 'Puerto Caicedo', 'Puerto Leguízamo', 'Colón', 'San Francisco', 'Santiago'
                ],
                'Quindío': [
                    'Armenia', 'Calarcá', 'Montenegro', 'La Tebaida', 'Quimbaya', 'Circasia',
                    'Filandia', 'Salento', 'Génova', 'Pijao', 'Córdoba', 'Buenavista'
                ],
                'Risaralda': [
                    'Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia', 'Belén de Umbría',
                    'Quinchía', 'Marsella', 'Santuario', 'Apía', 'Balboa', 'Guática', 'La Celia', 'Mistrató', 'Pueblo Rico'
                ],
                'San Andrés y Providencia': ['San Andrés', 'Providencia'],
                'Santander': [
                    'Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'San Gil', 'Socorro',
                    'Barbosa', 'Vélez', 'Málaga', 'Sabana de Torres', 'Lebrija', 'Rionegro', 'Puerto Wilches',
                    'San Vicente de Chucurí', 'El Carmen de Chucurí', 'Cimitarra', 'Landázuri', 'Charalá',
                    'Barichara', 'Curití', 'Villanueva', 'Aratoca', 'Zapatoca', 'Oiba', 'Suaita',
                    'Puente Nacional', 'Chipatá', 'Güepsa', 'San Benito', 'Capitanejo', 'Concepción',
                    'Cerrito', 'Carcasí', 'San Andrés', 'Guaca', 'Molagavita', 'Mogotes', 'Onzaga',
                    'San Joaquín', 'Ocamonte', 'Páramo', 'Valle de San José', 'Pinchote', 'Cabrera',
                    'Galán', 'Hato', 'Palmar', 'Palmas del Socorro', 'Simacota', 'Chima', 'Contratación',
                    'Guadalupe', 'Guapotá', 'El Guacamayo', 'Gámbita', 'Confines', 'Betulia', 'Los Santos',
                    'Matanza', 'Suratá', 'California', 'Vetas', 'Charta', 'Tona', 'El Playón', 'La Belleza',
                    'Florián', 'Albania', 'Jesús María', 'Bolívar', 'El Peñón', 'Sucre'
                ],
                'Sucre': [
                    'Sincelejo', 'Corozal', 'San Marcos', 'Sampués', 'San Onofre', 'Tolú', 'Coveñas',
                    'Majagual', 'Sincé', 'San Juan de Betulia', 'Buenavista', 'Caimito', 'Chalán', 'Colosó',
                    'El Roble', 'Galeras', 'Guaranda', 'La Unión', 'Los Palmitos', 'Morroa', 'Ovejas',
                    'Palmito', 'San Benito Abad', 'San Pedro', 'Sucre', 'Toluviejo'
                ],
                'Tolima': [
                    'Ibagué', 'Espinal', 'Melgar', 'Mariquita', 'Honda', 'Líbano', 'Chaparral', 'Guamo',
                    'Lérida', 'Fresno', 'Flandes', 'Purificación', 'Saldaña', 'Natagaima', 'Coyaima',
                    'Ortega', 'Planadas', 'Rioblanco', 'Ataco', 'Rovira', 'Cajamarca', 'Alvarado',
                    'Venadillo', 'Ambalema', 'Armero Guayabal', 'Falán', 'Palocabildo', 'Casabianca',
                    'Herveo', 'Murillo', 'Villahermosa', 'Santa Isabel', 'Anzoátegui', 'Piedras', 'Coello',
                    'San Luis', 'Valle de San Juan', 'Icononzo', 'Cunday', 'Villarrica', 'Carmen de Apicalá',
                    'Prado', 'Dolores', 'Alpujarra', 'Suárez', 'San Antonio', 'Roncesvalles'
                ],
                'Valle del Cauca': [
                    'Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Buga', 'Cartago', 'Jamundí', 'Yumbo',
                    'Candelaria', 'Florida', 'Pradera', 'Dagua', 'La Cumbre', 'Vijes', 'Restrepo',
                    'Calima (El Darién)', 'Yotoco', 'San Pedro', 'Guacarí', 'Ginebra', 'El Cerrito',
                    'Sevilla', 'Caicedonia', 'Zarzal', 'Roldanillo', 'La Unión', 'Toro', 'Obando',
                    'La Victoria', 'Alcalá', 'Ulloa', 'Ansermanuevo', 'El Águila', 'El Cairo', 'Argelia',
                    'Versalles', 'Bolívar', 'El Dovio', 'Trujillo', 'Riofrío', 'Andalucía', 'Bugalagrande'
                ],
                'Vaupés': ['Mitú', 'Carurú', 'Taraira', 'Pacoa', 'Papunaua', 'Yavaraté'],
                'Vichada': ['Puerto Carreño', 'La Primavera', 'Santa Rosalía', 'Cumaribo']
            }
        },
        'México': {
            etiqueta: 'Estado',
            divisiones: {
                'Aguascalientes': ['Aguascalientes', 'Jesús María', 'Calvillo', 'Rincón de Romos', 'Pabellón de Arteaga'],
                'Baja California': ['Tijuana', 'Mexicali', 'Ensenada', 'Playas de Rosarito', 'Tecate', 'San Quintín'],
                'Baja California Sur': ['La Paz', 'Los Cabos', 'Comondú', 'Mulegé', 'Loreto'],
                'Campeche': ['San Francisco de Campeche', 'Ciudad del Carmen', 'Champotón', 'Escárcega', 'Calkiní'],
                'Chiapas': ['Tuxtla Gutiérrez', 'Tapachula', 'San Cristóbal de las Casas', 'Comitán de Domínguez', 'Palenque', 'Chiapa de Corzo'],
                'Chihuahua': ['Chihuahua', 'Ciudad Juárez', 'Delicias', 'Cuauhtémoc', 'Hidalgo del Parral', 'Nuevo Casas Grandes'],
                'Ciudad de México': [
                    'Cuauhtémoc', 'Benito Juárez', 'Miguel Hidalgo', 'Coyoacán', 'Álvaro Obregón', 'Iztapalapa',
                    'Gustavo A. Madero', 'Tlalpan', 'Venustiano Carranza', 'Azcapotzalco', 'Iztacalco',
                    'Cuajimalpa de Morelos', 'Tláhuac', 'Xochimilco', 'La Magdalena Contreras', 'Milpa Alta'
                ],
                'Coahuila': ['Saltillo', 'Torreón', 'Monclova', 'Piedras Negras', 'Acuña', 'Ramos Arizpe', 'Sabinas'],
                'Colima': ['Colima', 'Manzanillo', 'Villa de Álvarez', 'Tecomán', 'Comala'],
                'Durango': ['Victoria de Durango', 'Gómez Palacio', 'Lerdo', 'Santiago Papasquiaro', 'Pueblo Nuevo'],
                'Estado de México': [
                    'Toluca', 'Ecatepec de Morelos', 'Naucalpan de Juárez', 'Tlalnepantla de Baz', 'Nezahualcóyotl',
                    'Atizapán de Zaragoza', 'Cuautitlán Izcalli', 'Metepec', 'Texcoco', 'Huixquilucan', 'Chimalhuacán', 'Ixtapaluca'
                ],
                'Guanajuato': ['León', 'Irapuato', 'Celaya', 'Salamanca', 'Guanajuato', 'San Miguel de Allende', 'Silao', 'Dolores Hidalgo'],
                'Guerrero': ['Acapulco de Juárez', 'Chilpancingo de los Bravo', 'Iguala de la Independencia', 'Zihuatanejo', 'Taxco de Alarcón'],
                'Hidalgo': ['Pachuca de Soto', 'Tulancingo', 'Tula de Allende', 'Mineral de la Reforma', 'Tizayuca', 'Huejutla de Reyes'],
                'Jalisco': ['Guadalajara', 'Zapopan', 'San Pedro Tlaquepaque', 'Tonalá', 'Tlajomulco de Zúñiga', 'Puerto Vallarta', 'Lagos de Moreno', 'Tepatitlán de Morelos', 'Ocotlán'],
                'Michoacán': ['Morelia', 'Uruapan', 'Zamora', 'Lázaro Cárdenas', 'Apatzingán', 'Pátzcuaro', 'Zitácuaro', 'La Piedad'],
                'Morelos': ['Cuernavaca', 'Jiutepec', 'Cuautla', 'Temixco', 'Emiliano Zapata', 'Yautepec', 'Tepoztlán'],
                'Nayarit': ['Tepic', 'Bahía de Banderas', 'Santiago Ixcuintla', 'Compostela', 'Xalisco'],
                'Nuevo León': ['Monterrey', 'San Pedro Garza García', 'San Nicolás de los Garza', 'Guadalupe', 'Apodaca', 'Santa Catarina', 'General Escobedo', 'García'],
                'Oaxaca': ['Oaxaca de Juárez', 'Salina Cruz', 'Tuxtepec', 'Juchitán de Zaragoza', 'Huajuapan de León', 'Santa Cruz Huatulco'],
                'Puebla': ['Puebla', 'Tehuacán', 'San Andrés Cholula', 'San Pedro Cholula', 'Atlixco', 'San Martín Texmelucan', 'Teziutlán'],
                'Querétaro': ['Santiago de Querétaro', 'El Marqués', 'Corregidora', 'San Juan del Río', 'Tequisquiapan'],
                'Quintana Roo': ['Cancún', 'Playa del Carmen', 'Chetumal', 'Tulum', 'Cozumel', 'Isla Mujeres'],
                'San Luis Potosí': ['San Luis Potosí', 'Soledad de Graciano Sánchez', 'Ciudad Valles', 'Matehuala', 'Rioverde'],
                'Sinaloa': ['Culiacán', 'Mazatlán', 'Ahome (Los Mochis)', 'Guasave', 'Navolato'],
                'Sonora': ['Hermosillo', 'Ciudad Obregón', 'Nogales', 'San Luis Río Colorado', 'Guaymas', 'Navojoa'],
                'Tabasco': ['Villahermosa', 'Cárdenas', 'Comalcalco', 'Macuspana', 'Paraíso', 'Huimanguillo'],
                'Tamaulipas': ['Reynosa', 'Matamoros', 'Nuevo Laredo', 'Tampico', 'Ciudad Victoria', 'Ciudad Madero', 'Altamira'],
                'Tlaxcala': ['Tlaxcala', 'Apizaco', 'Huamantla', 'Chiautempan', 'Zacatelco'],
                'Veracruz': ['Veracruz', 'Xalapa', 'Coatzacoalcos', 'Boca del Río', 'Córdoba', 'Orizaba', 'Poza Rica', 'Minatitlán'],
                'Yucatán': ['Mérida', 'Valladolid', 'Progreso', 'Kanasín', 'Tizimín', 'Umán'],
                'Zacatecas': ['Zacatecas', 'Guadalupe', 'Fresnillo', 'Jerez', 'Río Grande']
            }
        },
        'Perú': {
            etiqueta: 'Departamento / Región',
            divisiones: {
                'Amazonas': ['Chachapoyas', 'Bagua', 'Utcubamba', 'Bongará', 'Luya', 'Rodríguez de Mendoza', 'Condorcanqui'],
                'Áncash': ['Huaraz', 'Chimbote', 'Nuevo Chimbote', 'Casma', 'Huarmey', 'Carhuaz', 'Yungay'],
                'Apurímac': ['Abancay', 'Andahuaylas', 'Chincheros', 'Cotabambas', 'Aymaraes'],
                'Arequipa': ['Arequipa', 'Cayma', 'Cerro Colorado', 'Yanahuara', 'Camaná', 'Islay (Mollendo)', 'Caylloma'],
                'Ayacucho': ['Huamanga (Ayacucho)', 'Huanta', 'La Mar', 'Lucanas', 'Cangallo'],
                'Cajamarca': ['Cajamarca', 'Jaén', 'Chota', 'Cutervo', 'Cajabamba', 'Celendín'],
                'Callao': ['Callao', 'Bellavista', 'La Perla', 'La Punta', 'Carmen de la Legua Reynoso', 'Ventanilla', 'Mi Perú'],
                'Cusco': ['Cusco', 'Wanchaq', 'San Sebastián', 'Urubamba', 'Quillabamba', 'Sicuani', 'Calca'],
                'Huancavelica': ['Huancavelica', 'Tayacaja', 'Acobamba', 'Angaraes', 'Castrovirreyna'],
                'Huánuco': ['Huánuco', 'Tingo María', 'Amarilis', 'Ambo', 'Leoncio Prado'],
                'Ica': ['Ica', 'Chincha Alta', 'Pisco', 'Nasca', 'Palpa'],
                'Junín': ['Huancayo', 'El Tambo', 'Chilca', 'Tarma', 'La Oroya', 'Jauja', 'Chanchamayo', 'Satipo'],
                'La Libertad': ['Trujillo', 'Víctor Larco Herrera', 'Chepén', 'Pacasmayo', 'Huamachuco', 'Ascope', 'Virú'],
                'Lambayeque': ['Chiclayo', 'Lambayeque', 'Ferreñafe', 'José Leonardo Ortiz', 'La Victoria'],
                'Lima': [
                    'Lima', 'Miraflores', 'San Isidro', 'Santiago de Surco', 'San Borja', 'Barranco',
                    'La Molina', 'Magdalena del Mar', 'Jesús María', 'Lince', 'San Miguel', 'Pueblo Libre',
                    'Los Olivos', 'San Juan de Lurigancho', 'Chorrillos', 'Huacho', 'Huaral', 'Cañete', 'Barranca'
                ],
                'Loreto': ['Iquitos', 'Punchana', 'Belén', 'San Juan Bautista', 'Yurimaguas', 'Nauta'],
                'Madre de Dios': ['Puerto Maldonado', 'Tambopata', 'Iñapari', 'Manu'],
                'Moquegua': ['Moquegua', 'Ilo', 'Omate'],
                'Pasco': ['Cerro de Pasco', 'Oxapampa', 'Villa Rica', 'Yanahuanca'],
                'Piura': ['Piura', 'Castilla', 'Sullana', 'Talara', 'Paita', 'Sechura', 'Chulucanas'],
                'Puno': ['Puno', 'Juliaca', 'Ilave', 'Ayaviri', 'Azángaro'],
                'San Martín': ['Moyobamba', 'Tarapoto', 'Rioja', 'Juanjuí', 'Lamas', 'Tocache'],
                'Tacna': ['Tacna', 'Alto de la Alianza', 'Ciudad Nueva', 'Pocollay', 'Gregorio Albarracín'],
                'Tumbes': ['Tumbes', 'Zarumilla', 'Zorritos'],
                'Ucayali': ['Pucallpa', 'Yarinacocha', 'Manantay', 'Aguaytía', 'Atalaya']
            }
        },
        'Ecuador': {
            etiqueta: 'Provincia',
            divisiones: {
                'Azuay': ['Cuenca', 'Gualaceo', 'Paute', 'Santa Isabel', 'Sigsig'],
                'Bolívar': ['Guaranda', 'San Miguel', 'Chillanes', 'Echeandía'],
                'Cañar': ['Azogues', 'La Troncal', 'Cañar', 'Biblián'],
                'Carchi': ['Tulcán', 'Montúfar (San Gabriel)', 'Espejo', 'Mira'],
                'Chimborazo': ['Riobamba', 'Guano', 'Alausí', 'Chambo', 'Colta'],
                'Cotopaxi': ['Latacunga', 'Salcedo', 'Pujilí', 'La Maná', 'Saquisilí'],
                'El Oro': ['Machala', 'Pasaje', 'Santa Rosa', 'Huaquillas', 'Piñas', 'Zaruma'],
                'Esmeraldas': ['Esmeraldas', 'Atacames', 'Quinindé', 'San Lorenzo', 'Muisne'],
                'Galápagos': ['Puerto Ayora (Santa Cruz)', 'Puerto Baquerizo Moreno (San Cristóbal)', 'Puerto Villamil (Isabela)'],
                'Guayas': ['Guayaquil', 'Samborondón', 'Daule', 'Durán', 'Milagro', 'Playas', 'Naranjal', 'Yaguachi'],
                'Imbabura': ['Ibarra', 'Otavalo', 'Cotacachi', 'Antonio Ante (Atuntaqui)'],
                'Loja': ['Loja', 'Catamayo', 'Macará', 'Cariamanga', 'Saraguro'],
                'Los Ríos': ['Babahoyo', 'Quevedo', 'Vinces', 'Ventanas', 'Buena Fe', 'Baba'],
                'Manabí': ['Portoviejo', 'Manta', 'Chone', 'Montecristi', 'Bahía de Caráquez', 'Jipijapa', 'El Carmen'],
                'Morona Santiago': ['Macas', 'Sucúa', 'Gualaquiza', 'Palora'],
                'Napo': ['Tena', 'Archidona', 'El Chaco', 'Quijos (Baeza)'],
                'Orellana': ['Puerto Francisco de Orellana (El Coca)', 'La Joya de los Sachas', 'Loreto'],
                'Pastaza': ['Puyo', 'Mera', 'Santa Clara', 'Arajuno'],
                'Pichincha': ['Quito', 'Rumiñahui (Sangolquí)', 'Cayambe', 'Mejía (Machachi)', 'Pedro Moncayo'],
                'Santa Elena': ['Santa Elena', 'Salinas', 'La Libertad'],
                'Santo Domingo de los Tsáchilas': ['Santo Domingo', 'La Concordia'],
                'Sucumbíos': ['Nueva Loja (Lago Agrio)', 'Shushufindi', 'Gonzalo Pizarro', 'Cascales'],
                'Tungurahua': ['Ambato', 'Baños de Agua Santa', 'Pelileo', 'Píllaro', 'Cevallos'],
                'Zamora Chinchipe': ['Zamora', 'Yantzaza', 'El Pangui', 'Centinela del Cóndor']
            }
        },
        'Chile': {
            etiqueta: 'Región',
            divisiones: {
                'Arica y Parinacota': ['Arica', 'Putre', 'Camarones', 'General Lagos'],
                'Tarapacá': ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Pica'],
                'Antofagasta': ['Antofagasta', 'Calama', 'Tocopilla', 'Mejillones', 'San Pedro de Atacama', 'Taltal'],
                'Atacama': ['Copiapó', 'Vallenar', 'Caldera', 'Chañaral', 'Diego de Almagro'],
                'Coquimbo': ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel', 'Vicuña', 'Los Vilos'],
                'Valparaíso': ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'Concón', 'Quillota', 'San Antonio', 'Los Andes', 'San Felipe'],
                'Metropolitana de Santiago': [
                    'Santiago', 'Providencia', 'Las Condes', 'Ñuñoa', 'Vitacura', 'Lo Barnechea',
                    'Maipú', 'Puente Alto', 'La Florida', 'San Bernardo', 'San Miguel', 'Peñalolén',
                    'La Reina', 'Estación Central', 'Recoleta', 'Independencia', 'Colina', 'Buin'
                ],
                "Libertador General Bernardo O'Higgins": ['Rancagua', 'Machalí', 'San Fernando', 'Rengo', 'Santa Cruz', 'Pichilemu'],
                'Maule': ['Talca', 'Curicó', 'Linares', 'Constitución', 'Cauquenes', 'Parral'],
                'Ñuble': ['Chillán', 'Chillán Viejo', 'San Carlos', 'Bulnes', 'Coelemu'],
                'Biobío': ['Concepción', 'Talcahuano', 'San Pedro de la Paz', 'Los Ángeles', 'Chiguayante', 'Coronel', 'Hualpén', 'Tomé'],
                'La Araucanía': ['Temuco', 'Padre Las Casas', 'Villarrica', 'Pucón', 'Angol', 'Victoria'],
                'Los Ríos': ['Valdivia', 'La Unión', 'Río Bueno', 'Panguipulli', 'Paillaco'],
                'Los Lagos': ['Puerto Montt', 'Osorno', 'Puerto Varas', 'Castro', 'Ancud', 'Frutillar'],
                'Aysén del General Carlos Ibáñez del Campo': ['Coyhaique', 'Puerto Aysén', 'Chile Chico', 'Cochrane'],
                'Magallanes y de la Antártica Chilena': ['Punta Arenas', 'Puerto Natales', 'Porvenir', 'Puerto Williams']
            }
        },
        'Argentina': {
            etiqueta: 'Provincia',
            divisiones: {
                'Buenos Aires': [
                    'La Plata', 'Mar del Plata', 'Bahía Blanca', 'Quilmes', 'Lanús', 'Lomas de Zamora',
                    'Avellaneda', 'San Isidro', 'Vicente López', 'Tigre', 'Morón', 'San Martín',
                    'Tandil', 'Olavarría', 'Pilar', 'Escobar', 'Zárate', 'Pergamino', 'Junín'
                ],
                'Catamarca': ['San Fernando del Valle de Catamarca', 'Valle Viejo', 'Andalgalá', 'Belén', 'Tinogasta'],
                'Chaco': ['Resistencia', 'Presidencia Roque Sáenz Peña', 'Barranqueras', 'Villa Ángela', 'Charata'],
                'Chubut': ['Comodoro Rivadavia', 'Trelew', 'Puerto Madryn', 'Rawson', 'Esquel'],
                'Ciudad Autónoma de Buenos Aires': [
                    'Buenos Aires', 'Palermo', 'Recoleta', 'Belgrano', 'Caballito', 'Villa Crespo',
                    'Almagro', 'San Telmo', 'Puerto Madero', 'Núñez', 'Flores', 'Villa Urquiza', 'Colegiales', 'Chacarita'
                ],
                'Córdoba': ['Córdoba', 'Villa Carlos Paz', 'Río Cuarto', 'Villa María', 'San Francisco', 'Alta Gracia', 'Río Tercero'],
                'Corrientes': ['Corrientes', 'Goya', 'Paso de los Libres', 'Curuzú Cuatiá', 'Mercedes'],
                'Entre Ríos': ['Paraná', 'Concordia', 'Gualeguaychú', 'Concepción del Uruguay', 'Gualeguay'],
                'Formosa': ['Formosa', 'Clorinda', 'Pirané', 'El Colorado'],
                'Jujuy': ['San Salvador de Jujuy', 'Palpalá', 'San Pedro de Jujuy', 'Libertador General San Martín', 'Tilcara', 'Humahuaca'],
                'La Pampa': ['Santa Rosa', 'General Pico', 'Toay', 'General Acha'],
                'La Rioja': ['La Rioja', 'Chilecito', 'Chamical', 'Aimogasta'],
                'Mendoza': ['Mendoza', 'Godoy Cruz', 'Guaymallén', 'Las Heras', 'Luján de Cuyo', 'Maipú', 'San Rafael', 'Tunuyán'],
                'Misiones': ['Posadas', 'Oberá', 'Eldorado', 'Puerto Iguazú', 'Apóstoles'],
                'Neuquén': ['Neuquén', 'Plottier', 'Centenario', 'San Martín de los Andes', 'Villa La Angostura', 'Zapala'],
                'Río Negro': ['San Carlos de Bariloche', 'Viedma', 'General Roca', 'Cipolletti', 'El Bolsón'],
                'Salta': ['Salta', 'San Ramón de la Nueva Orán', 'Tartagal', 'Cafayate', 'Metán'],
                'San Juan': ['San Juan', 'Rivadavia', 'Rawson', 'Chimbas', 'Santa Lucía', 'Caucete'],
                'San Luis': ['San Luis', 'Villa Mercedes', 'Merlo', 'Juana Koslay'],
                'Santa Cruz': ['Río Gallegos', 'Caleta Olivia', 'El Calafate', 'Pico Truncado', 'Puerto Deseado'],
                'Santa Fe': ['Rosario', 'Santa Fe', 'Rafaela', 'Venado Tuerto', 'Reconquista', 'Villa Gobernador Gálvez', 'Santo Tomé'],
                'Santiago del Estero': ['Santiago del Estero', 'La Banda', 'Termas de Río Hondo', 'Añatuya', 'Frías'],
                'Tierra del Fuego': ['Ushuaia', 'Río Grande', 'Tolhuin'],
                'Tucumán': ['San Miguel de Tucumán', 'Yerba Buena', 'Tafí Viejo', 'Banda del Río Salí', 'Concepción']
            }
        },
        'Otro': {
            etiqueta: 'Estado / Región',
            divisiones: {
                'General': ['Otra ciudad']
            }
        }
    };

    const collator = new Intl.Collator('es', { sensitivity: 'base' });

    function obtenerPaises() {
        return Object.keys(DATA);
    }

    function etiquetaDivision(pais) {
        if (!pais || pais === 'todos') return 'Departamento / Estado';
        return (DATA[pais] && DATA[pais].etiqueta) || 'Departamento / Región';
    }

    function obtenerDepartamentos(pais) {
        if (!pais || pais === 'todos') {
            return Object.keys(DATA['Colombia'].divisiones).sort(collator.compare);
        }
        const entry = DATA[pais];
        if (!entry || !entry.divisiones) return [];
        return Object.keys(entry.divisiones).sort(collator.compare);
    }

    function obtenerMunicipios(pais, departamento) {
        if (!departamento || departamento === 'todos') return [];

        if (pais && pais !== 'todos') {
            const lista = DATA[pais] && DATA[pais].divisiones && DATA[pais].divisiones[departamento];
            return Array.isArray(lista) ? [...lista].sort(collator.compare) : [];
        }

        // Cuando el país es "todos", buscar primero en Colombia y combinar cualquier coincidencia exacta
        const combinados = new Set();
        if (DATA['Colombia'] && DATA['Colombia'].divisiones[departamento]) {
            DATA['Colombia'].divisiones[departamento].forEach((m) => combinados.add(m));
        }
        Object.keys(DATA).forEach((p) => {
            if (p === 'Colombia') return;
            const lista = DATA[p] && DATA[p].divisiones && DATA[p].divisiones[departamento];
            if (Array.isArray(lista)) {
                lista.forEach((m) => combinados.add(m));
            }
        });
        return Array.from(combinados).sort(collator.compare);
    }

    global.CatalogoGeo = Object.freeze({
        DATA,
        obtenerPaises,
        etiquetaDivision,
        obtenerDepartamentos,
        obtenerMunicipios
    });
})(window);

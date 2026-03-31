import { cosmosCode } from './components/CosmosShaderCode';
import { cosmosCode2 } from './components/CosmosShaderCode2';
import { cosmosCode3 } from './components/CosmosShaderCode3';
import { fragmentShader as planetCode } from './components/PlanetShaderCode';
import { fragmentShader as seascapeCode } from './components/SeascapeShaderCode';
import { fragmentShader as luminescenceCode } from './components/LuminescenceShaderCode';
import { fragmentShader as fractalCode } from './components/FractalShaderCode';
import { crossingStormsCode } from './components/CrossingStormsShaderCode';
import { coldStrandsCode } from './components/ColdStrandsShaderCode';
import { etherealCode } from './components/EtherealShaderCode';
import { cosmicEnergyCode } from './components/CosmicEnergyShaderCode';
import { synapsesCode } from './components/SynapsesShaderCode';
import { gemmariumCode } from './components/GemmariumShaderCode';
import { blueMarbleCode } from './components/BlueMarbleShaderCode';
import { sunWaterCloudStarsCode } from './components/SunWaterCloudStarsShaderCode';
import { cloudyTunnelCode } from './components/CloudyTunnelShaderCode';
import { imageSequenceCode } from './components/ImageSequenceShaderCode';

export const blackShader = `
void main() {
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

export const shaderRegistry: Record<string, { name: string; code: string }[]> = {
  cosmos: [
    { name: 'Cosmos 3', code: cosmosCode3 },
    { name: 'Cosmos 1', code: cosmosCode },
    { name: 'Cosmos 2', code: cosmosCode2 },    
    { name: 'Cosmic Energy', code: cosmicEnergyCode },
    { name: 'Blue Marble', code: blueMarbleCode },
  ],
  planet: [
    { name: 'Planet 1', code: planetCode },
  ],
  ocean: [
    { name: 'Ocean 1', code: seascapeCode },
    { name: 'Sun Water Cloud Stars', code: sunWaterCloudStarsCode },
    { name: 'Cloudy Tunnel', code: cloudyTunnelCode },
  ],
  luminescence: [
    { name: 'Luminescence 1', code: luminescenceCode },
    { name: 'Cold Strands', code: coldStrandsCode },      
  ],
  microscopic: [
    { name: 'Gemmarium', code: gemmariumCode },
    { name: 'Microscopic 1', code: fractalCode },
    { name: 'Synapses', code: synapsesCode },
  ],
  final: [
    { name: 'Blue Marble', code: blueMarbleCode },
    { name: 'Crossing Storms', code: crossingStormsCode },
    { name: 'Ethereal', code: etherealCode },
    { name: 'Black', code: blackShader },
  ],
  image_sequence: [
    { name: 'Image Sequence', code: imageSequenceCode },
  ]
};

export const allShaders = Object.entries(shaderRegistry).flatMap(([category, shaders]) => 
  shaders.map((shader, index) => ({
    id: `${category}-${index}`,
    name: shader.name,
    code: shader.code
  }))
);

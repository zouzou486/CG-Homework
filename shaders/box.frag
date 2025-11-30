#version 300 es
precision mediump float;

out vec4 FragColor;

uniform float ambientStrength, specularStrength, diffuseStrength, shininess;

in vec3 Normal;//法向量
in vec3 FragPos;//相机观察的片元位置
in vec2 TexCoord;//纹理坐标
in vec4 FragPosLightSpace;//光源观察的片元位置

uniform vec3 viewPos;//相机位置
uniform vec4 u_lightPosition; //光源位置	
uniform vec3 lightColor;//入射光颜色

uniform sampler2D diffuseTexture;
uniform sampler2D depthTexture;
uniform samplerCube cubeSampler;//盒子纹理采样器

float shadowCalculation(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir)
{
    // 执行透视除法，将坐标变换到[-1,1]的范围
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    
    // 变换到[0,1]的范围，用于纹理采样
    projCoords = projCoords * 0.5 + 0.5;
    
    // 如果片段在光源视锥体之外，则不在阴影中
    if(projCoords.z > 1.0)
        return 0.0;
    
    // 从深度纹理中获取最近的深度
    float closestDepth = texture(depthTexture, projCoords.xy).r;
    
    // 获取当前片段的深度
    float currentDepth = projCoords.z;
    
    // 添加阴影偏移量以避免阴影痤疮
    float bias = max(0.05 * (1.0 - dot(normal, lightDir)), 0.005);
    
    // 检查当前片段是否在阴影中
    float shadow = currentDepth - bias > closestDepth ? 1.0 : 0.0;
    
    return shadow;
}       

void main()
{
    //采样纹理颜色
    vec3 TextureColor = texture(diffuseTexture, TexCoord).xyz;

    //计算光照颜色
    vec3 norm = normalize(Normal);
    vec3 lightDir;
    if(u_lightPosition.w == 1.0) 
        lightDir = normalize(u_lightPosition.xyz - FragPos);
    else 
        lightDir = normalize(u_lightPosition.xyz);
    
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 halfDir = normalize(viewDir + lightDir);

    /*TODO2:根据phong shading方法计算ambient,diffuse,specular*/
    vec3 ambient, diffuse, specular;

    // 环境光
    ambient = ambientStrength * lightColor;

    // 漫反射
    float diff = max(dot(norm, lightDir), 0.0);
    diffuse = diffuseStrength * diff * lightColor;

    // 镜面反射
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    specular = specularStrength * spec * lightColor;
  
    vec3 lightReflectColor = (ambient + diffuse + specular);

    // 判定是否阴影，并对各种颜色进行混合
    float shadow = shadowCalculation(FragPosLightSpace, norm, lightDir);
    
    // 两种混合方式都可以，根据效果选择
    vec3 resultColor = (ambient + (1.0 - shadow) * (diffuse + specular)) * TextureColor;
    // vec3 resultColor = (1.0 - shadow / 2.0) * lightReflectColor * TextureColor;
    
    FragColor = vec4(resultColor, 1.0);
}
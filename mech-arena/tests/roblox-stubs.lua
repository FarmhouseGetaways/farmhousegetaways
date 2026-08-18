-- Minimal stand-ins for the Roblox types the geometry code touches, so the
-- real blueprint and bounds code can run outside Studio.
local V3 = {}
V3.__index = V3
local function vec(x, y, z) return setmetatable({X=x, Y=y, Z=z}, V3) end
function V3.__add(a, b) return vec(a.X+b.X, a.Y+b.Y, a.Z+b.Z) end
function V3.__sub(a, b) return vec(a.X-b.X, a.Y-b.Y, a.Z-b.Z) end
function V3.__div(a, n) return vec(a.X/n, a.Y/n, a.Z/n) end
function V3.__mul(a, n)
  if type(n) == "number" then return vec(a.X*n, a.Y*n, a.Z*n) end
  return vec(a.X*n.X, a.Y*n.Y, a.Z*n.Z)
end
function V3.__tostring(v) return string.format("(%.3f, %.3f, %.3f)", v.X, v.Y, v.Z) end
Vector3 = { new = vec }

-- Row-major 3x3 rotation plus translation.
local CF = {}
CF.__index = CF
local function cf(px, py, pz, m)
  return setmetatable({p={px,py,pz}, m = m or {1,0,0, 0,1,0, 0,0,1}}, CF)
end
local function matmul(a, b)
  local r = {}
  for i = 0, 2 do
    for j = 0, 2 do
      local s = 0
      for k = 0, 2 do s = s + a[i*3+k+1] * b[k*3+j+1] end
      r[i*3+j+1] = s
    end
  end
  return r
end
function CF.__mul(a, b)
  if getmetatable(b) == V3 then
    local m, p = a.m, a.p
    return vec(
      m[1]*b.X + m[2]*b.Y + m[3]*b.Z + p[1],
      m[4]*b.X + m[5]*b.Y + m[6]*b.Z + p[2],
      m[7]*b.X + m[8]*b.Y + m[9]*b.Z + p[3])
  end
  local m = matmul(a.m, b.m)
  local px = a.m[1]*b.p[1] + a.m[2]*b.p[2] + a.m[3]*b.p[3] + a.p[1]
  local py = a.m[4]*b.p[1] + a.m[5]*b.p[2] + a.m[6]*b.p[3] + a.p[2]
  local pz = a.m[7]*b.p[1] + a.m[8]*b.p[2] + a.m[9]*b.p[3] + a.p[3]
  return cf(px, py, pz, m)
end
CFrame = {
  new = function(v) return cf(v.X, v.Y, v.Z) end,
  Angles = function(x, y, z)
    local cx, sx = math.cos(x), math.sin(x)
    local cy, sy = math.cos(y), math.sin(y)
    local cz, sz = math.cos(z), math.sin(z)
    local rx = {1,0,0, 0,cx,-sx, 0,sx,cx}
    local ry = {cy,0,sy, 0,1,0, -sy,0,cy}
    local rz = {cz,-sz,0, sz,cz,0, 0,0,1}
    return cf(0, 0, 0, matmul(matmul(rx, ry), rz))
  end,
}

Color3 = { fromRGB = function(r,g,b) return {r=r,g=g,b=b} end }
Enum = setmetatable({}, {__index = function(_, k)
  return setmetatable({}, {__index = function(_, n) return k .. "." .. n end})
end})

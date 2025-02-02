import jsonServerProvider from 'ra-data-json-server'
import httpClient from './httpClient'
import { REST_URL } from '../consts'

const dataProvider = jsonServerProvider(REST_URL, httpClient)

const mapResource = (resource, params) => {
  switch (resource) {
    case 'playlistTrack':
      // /api/playlistTrack?playlist_id=123  => /api/playlist/123/tracks
      let plsId = '0'
      if (params.filter) {
        plsId = params.filter.playlist_id
      }
      return [`playlist/${plsId}/tracks`, params]

    default:
      return [resource, params]
  }
}

const callDeleteMany = (resource, params) => {
  const ids = params.ids.map((id) => `id=${id}`)
  const idsParam = ids.join('&')
  return httpClient(`${REST_URL}/${resource}?${idsParam}`, {
    method: 'DELETE',
  }).then((response) => ({ data: response.json.ids || [] }))
}

const wrapperDataProvider = {
  ...dataProvider,
  getList: (resource, params) => {
    const [r, p] = mapResource(resource, params)
    return dataProvider.getList(r, p)
  },
  getOne: (resource, params) => {
    if (resource === "playlistTrack") {
      const urlParams = params.id ? `?id=${params.id}` : '';
      const url = `api/playlist/${params.filter.playlist_id}/tracks/` + urlParams;
      return httpClient(url).then(resp => {
        return {
          data: {
            id: params.filter.playlist_id,
            tracks: resp.json
          }
        }
      });
    }
    const [r, p] = mapResource(resource, params)
    return dataProvider.getOne(r, p)
  },
  getMany: (resource, params) => {
    const [r, p] = mapResource(resource, params)
    return dataProvider.getMany(r, p)
  },
  getManyReference: (resource, params) => {
    const [r, p] = mapResource(resource, params)
    return dataProvider.getManyReference(r, p)
  },
  update: (resource, params) => {
    const [r, p] = mapResource(resource, params)
    return dataProvider.update(r, p)
  },
  updateMany: (resource, params) => {
    const [r, p] = mapResource(resource, params)
    return dataProvider.updateMany(r, p)
  },
  create: (resource, params) => {
    const [r, p] = mapResource(resource, params)
    return dataProvider.create(r, p)
  },
  delete: (resource, params) => {
    if (resource === "playlistTrack") {
      return httpClient(`api/playlist/${params.filter.playlist_id}/tracks/?id=${params.id}`, {
        method: 'DELETE',
      }).then(resp => { return { data: resp } })
    }

    const [r, p] = mapResource(resource, params)
    return dataProvider.delete(r, p)
  },
  deleteMany: (resource, params) => {
    const [r, p] = mapResource(resource, params)
    if (r.endsWith('/tracks')) {
      return callDeleteMany(r, p)
    }
    return dataProvider.deleteMany(r, p)
  },
  addToPlaylist: (playlistId, data) => {
    return httpClient(`${REST_URL}/playlist/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(({ json }) => ({ data: json }))
  },
}

export default wrapperDataProvider

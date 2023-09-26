# Thoth

-- TODO --

## Installation

Install Thoth with the <a href="">official docker image</a>

```bash
  docker run intellectualsites/thoth:latest
    -p 1234:1234
    -v /data:/data
```

## API Reference

#### Get general paste data

```http
  GET /api/paste/${id}
```

| Parameter | Type     | Description                                  |
|:----------|:---------|:---------------------------------------------|
| `id`      | `string` | **Required**. The ID of the to-fetched paste |

#### Get paste metadata

```http
  GET /api/paste/${id}/metadata
```

| Parameter | Type     | Description                                                 |
|:----------|:---------|:------------------------------------------------------------|
| `id`      | `string` | **Required**. The ID of the paste to fetch the metadata for |

-- TODO --

## Run Locally

Clone the project

```bash
  git clone https://https://github.com/IntellectualSites/Thoth.git
```

Go to the project directory

```bash
  cd Thoth
```

-- TODO --

## Running Tests

To run tests, run the following command

-- TODO --
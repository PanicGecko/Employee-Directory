from datetime import datetime

from fastapi import HTTPException, status

from dto.officeDto import OfficeCreateRequest, OfficeResponse, OfficeUpdateRequest
from models.office import Office
from repos.officeRepo import (
    create_office,
    get_office_by_id,
    update_office,
)


def create_office_service(session, office_data: OfficeCreateRequest) -> OfficeResponse:
    normalized_name = office_data.name.strip()

    if not normalized_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Office name is required",
        )

    office = Office(
        name=normalized_name,
        street_address=office_data.street_address.strip(),
        city=office_data.city.strip(),
        state=office_data.state.strip() if office_data.state else None,
        zip_code=office_data.zip_code.strip() if office_data.zip_code else None,
        country=office_data.country.strip(),
    )

    created_office = create_office(session=session, office=office)

    return OfficeResponse(
        id=created_office.id,
        name=created_office.name,
        street_address=created_office.street_address,
        city=created_office.city,
        state=created_office.state,
        zip_code=created_office.zip_code,
        country=created_office.country,
        created_at=created_office.created_at,
        updated_at=created_office.updated_at,
    )


def update_office_service(
    session,
    office_id: int,
    office_data: OfficeUpdateRequest,
) -> OfficeResponse:
    if all(
        v is None
        for v in [
            office_data.name,
            office_data.street_address,
            office_data.city,
            office_data.state,
            office_data.zip_code,
            office_data.country,
        ]
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided for update",
        )

    office = get_office_by_id(session=session, office_id=office_id)
    if office is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Office not found",
        )

    original_values = {
        "name": office.name,
        "street_address": office.street_address,
        "city": office.city,
        "state": office.state,
        "zip_code": office.zip_code,
        "country": office.country,
    }

    if office_data.name is not None:
        new_name = office_data.name.strip()
        if not new_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Office name is required",
            )
        office.name = new_name

    if office_data.street_address is not None:
        office.street_address = office_data.street_address.strip()

    if office_data.city is not None:
        office.city = office_data.city.strip()

    if office_data.state is not None:
        office.state = office_data.state.strip() or None

    if office_data.zip_code is not None:
        office.zip_code = office_data.zip_code.strip() or None

    if office_data.country is not None:
        office.country = office_data.country.strip()

    if (
        office.name == original_values["name"]
        and office.street_address == original_values["street_address"]
        and office.city == original_values["city"]
        and office.state == original_values["state"]
        and office.zip_code == original_values["zip_code"]
        and office.country == original_values["country"]
    ):
        return OfficeResponse(
            id=office.id,
            name=office.name,
            street_address=office.street_address,
            city=office.city,
            state=office.state,
            zip_code=office.zip_code,
            country=office.country,
            created_at=office.created_at,
            updated_at=office.updated_at,
        )

    office.updated_at = datetime.utcnow()

    updated_office = update_office(session=session, office=office)

    return OfficeResponse(
        id=updated_office.id,
        name=updated_office.name,
        street_address=updated_office.street_address,
        city=updated_office.city,
        state=updated_office.state,
        zip_code=updated_office.zip_code,
        country=updated_office.country,
        created_at=updated_office.created_at,
        updated_at=updated_office.updated_at,
    )
